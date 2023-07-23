import { useUser } from "@clerk/nextjs";
import { api } from "~/utils/api";
import { LoadingPage } from "./loading";
import { PostView } from "./postView";

export const Feed = () => {
  const { isLoaded: userLoaded } = useUser();

  const { data, isLoading: postsLoading, error } = api.posts.getAll.useQuery();

  // Return empty div if user and posts are not loaded
  if (!userLoaded && postsLoading) return <div />;
  // Return loading page if user is not loaded
  if (!userLoaded || !data) return <LoadingPage size={64} />;
  // Return error page if error
  if (error) return <div>Something went wrong</div>;

  return (
    <div className="flex flex-col">
      {data?.map((fullPost) => (
        <PostView key={fullPost.post.id} {...fullPost} />
      ))}
    </div>
  );
};
