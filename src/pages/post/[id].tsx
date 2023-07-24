import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import { LoadingPage } from "~/components/loading";
import { PostView } from "~/components/postView";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { CreateReplyWizard } from "~/components/createReplyWizard";
import { RepliesFeed } from "~/components/feed";

const SinglePostPage: NextPage<{ id: string }> = ({ id }) => {
  const { data, isLoading } = api.posts.getById.useQuery({
    id,
  });

  if (isLoading) return <LoadingPage />;
  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{`${data.post.content} - @${data.author.username}`}</title>
      </Head>
      <PageLayout>
        <PostView post={data.post} author={data.author} />
        <div className="border-b border-slate-400 p-4">
          <CreateReplyWizard postId={id} />
        </div>
        <RepliesFeed postId={id} />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();
  const id = context.params?.id;
  if (typeof id !== "string") throw new Error("no id");

  await ssg.posts.getById.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default SinglePostPage;
