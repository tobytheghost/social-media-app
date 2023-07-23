import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { api } from "~/utils/api";
import { LoadingSpinner } from "./loading";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { type FormEvent } from "react";

export const CreatePostWizard = () => {
  const { user, isSignedIn } = useUser();
  const { register, reset, handleSubmit } = useForm<{ content: string }>();

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: async () => await ctx.posts.getAll.invalidate(),
    onError: (err) => {
      const errorMessage = err.data?.zodError?.fieldErrors.content;
      if (errorMessage?.[0]) {
        toast.error(errorMessage[0]);
      } else {
        toast.error("Something went wrong");
      }
    },
    onSettled: () => reset({ content: "" }),
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit((data) => {
      mutate(data);
    })(event);
  };

  if (!isSignedIn) return null;

  return (
    <form className="flex w-full gap-3" onSubmit={onSubmit}>
      <Image
        src={user.profileImageUrl}
        alt={user.fullName ?? ""}
        width={56}
        height={56}
        className="h-14 w-14 rounded-full"
      />
      <input
        placeholder="Type some emojis!"
        className="grow bg-transparent"
        type="text"
        disabled={isPosting}
        {...register("content")}
      />
      {isPosting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner size={20} />
        </div>
      )}
      <button className="" type="submit" disabled={isPosting}>
        Post
      </button>
    </form>
  );
};
