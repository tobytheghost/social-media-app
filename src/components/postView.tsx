import dayjs from "dayjs";
import Link from "next/link";
import { type RouterOutputs } from "~/utils/api";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";

dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["posts"]["getAll"][number];

export const PostView = ({ post, author }: PostWithUser) => {
  const timeSince = dayjs(post.createdAt).fromNow();

  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-4">
      <Link href={`/@${author.username}`}>
        <Image
          src={author.profileImageUrl}
          alt={author.username ?? ""}
          width={48}
          height={48}
          className="h-12 w-12 rounded-full"
        />
      </Link>
      <div className="flex flex-col">
        <div className="flex gap-2 font-bold text-slate-300">
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username} `}</span>
          </Link>
          <span>{" · "}</span>
          <Link href={`/post/${post.id}`}>
            <span className="font-thin">{`${timeSince}`}</span>
          </Link>
        </div>
        <div className="text-2xl">{post.content}</div>
      </div>
    </div>
  );
};
