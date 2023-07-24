import Link from "next/link";
import Image from "next/image";
import { type RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type ReplyWithUser = RouterOutputs["replies"]["getAllByPostId"][number];

const ReplyAuthorImage = ({ src, alt }: { src: string; alt: string }) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={40}
      height={40}
      className="h-10 w-10 rounded-full"
    />
  );
};

export const ReplyView = ({ reply, author }: ReplyWithUser) => {
  const timeSince = dayjs(reply.createdAt).fromNow();

  return (
    <div key={reply.id} className="flex gap-3 border-b border-slate-400 p-4">
      {author.username ? (
        <Link href={`/@${author.username}`}>
          <ReplyAuthorImage
            src={author.profileImageUrl}
            alt={author.username ?? ""}
          />
        </Link>
      ) : (
        <ReplyAuthorImage
          src={author.profileImageUrl}
          alt={`${author.firstName}_${author.lastName}` ?? ""}
        />
      )}
      <div className="flex flex-col">
        <div className="flex gap-2 font-bold text-slate-300">
          {author.username ? (
            <Link href={`/@${author.username}`}>
              <span>{`@${author.username} `}</span>
            </Link>
          ) : (
            <span>
              {`@${author.firstName}_${author.lastName}`.toLowerCase()}
            </span>
          )}
          <span>{" · "}</span>
          <span className="font-thin">{`${timeSince}`}</span>
        </div>
        <div className="text-2xl">{reply.content}</div>
      </div>
    </div>
  );
};
