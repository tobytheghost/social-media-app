import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { api } from "~/utils/api";
import { LoadingSpinner } from "./loading";
import { useForm } from "react-hook-form";
import { type FormEvent } from "react";

export const CreateReplyWizard = ({ postId }: { postId: string }) => {
  const { isSignedIn } = useUser();
  const { register, reset, handleSubmit } = useForm<{ content: string }>();

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.replies.create.useMutation({
    onSuccess: async () => await ctx.replies.getAllByPostId.invalidate(),
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
      mutate({ ...data, postId });
    })(event);
  };

  if (!isSignedIn) return null;

  return (
    <form className="flex w-full gap-3" onSubmit={onSubmit}>
      <input
        placeholder="Reply ..."
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
