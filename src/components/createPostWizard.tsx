import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "~/utils/api";
import { LoadingSpinner } from "./loading";
import Image from "next/image";

export const CreatePostWizard = () => {
  const { user, isSignedIn } = useUser();
  const [content, setContent] = useState("");

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: async () => {
      setContent("");
      await ctx.posts.getAll.invalidate();
    },
    onError: (err) => {
      const errorMessage = err.data?.zodError?.fieldErrors.content;
      if (errorMessage?.[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Something went wrong");
      }
    },
  });

  if (!isSignedIn) return null;

  return (
    <div className="flex w-full gap-3">
      <Image
        src={user.profileImageUrl}
        alt={user.fullName ?? ""}
        width={56}
        height={56}
        className="h-14 w-14 rounded-full"
      />
      <input
        placeholder="Type some emojis!"
        className="grow bg-transparent outline-none"
        type="text"
        value={content}
        disabled={isPosting}
        onChange={(e) => setContent(e.target.value)}
        onKeyUp={(e) => {
          if (e.key !== "Enter") return;
          mutate({ content });
        }}
      />
      {isPosting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </div>
  );
};
