import { clerkClient } from "@clerk/nextjs";
import { type Post } from "@prisma/client";
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

const postSchema = z.object({
  content: z
    .string()
    .emoji({
      message: "Only emojis are allowed in posts",
    })
    .min(1)
    .max(200),
});

const addUserDataToPosts = async (posts: Post[]) => {
  const users = (
    await clerkClient.users.getUserList({
      userId: posts.map((post) => post.authorId),
      limit: 100,
    })
  ).map(filterUserForClient);

  return posts.map((post) => {
    const author = users.find((user) => user.id === post.authorId);

    if (!author?.username) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Author not found",
      });
    }

    return {
      post,
      author: {
        ...author,
        username: author.username,
      },
    };
  });
};

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [
        {
          createdAt: "desc",
        },
      ],
    });

    return await addUserDataToPosts(posts);
  }),

  getPostsByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.post
        .findMany({
          where: {
            authorId: input.userId,
          },
          take: 100,
          orderBy: [
            {
              createdAt: "desc",
            },
          ],
        })
        .then(addUserDataToPosts);
    }),

  create: privateProcedure
    .input(postSchema)
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;

      // Rate limiter
      const { success } = await ratelimit.limit(authorId);
      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

      const { content } = input;
      const post = await ctx.prisma.post.create({
        data: {
          authorId,
          content,
        },
      });
      return post;
    }),
});
