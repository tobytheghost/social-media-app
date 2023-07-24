import { clerkClient } from "@clerk/nextjs";
import { type Reply } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { z } from "zod";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { filterUserForClient } from "~/server/helpers/filterUserForClients";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});

const replySchema = z.object({
  postId: z.string(),
  content: z
    .string()
    .emoji({
      message: "Only emojis are allowed in posts",
    })
    .min(1)
    .max(200),
});

const addUserDataToReplies = async (replies: Reply[]) => {
  const users = (
    await clerkClient.users.getUserList({
      userId: replies.map((reply) => reply.authorId),
      limit: 100,
    })
  ).map(filterUserForClient);

  return replies.map((reply) => {
    const author = users.find((user) => user.id === reply.authorId);

    if (!author?.username) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Author not found",
      });
    }

    return {
      reply,
      author: {
        ...author,
        username: author.username,
      },
    };
  });
};

export const repliesRouter = createTRPCRouter({
  /**
   * Get all replies by postId
   */
  getAllByPostId: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      const replies = await ctx.prisma.reply.findMany({
        where: {
          postId: input.postId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return await addUserDataToReplies(replies);
    }),

  /**
   * Create a reply
   */
  create: privateProcedure
    .input(replySchema)
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;

      // Rate limiter
      const { success } = await ratelimit.limit(authorId);
      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

      const { content, postId } = input;
      const reply = await ctx.prisma.reply.create({
        data: {
          postId,
          authorId,
          content,
        },
      });
      return reply;
    }),
});
