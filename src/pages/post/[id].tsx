import React, { ReactElement, useState } from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { API, withSSRContext } from "aws-amplify";
import { getPost, listPosts } from "../../graphql/queries";
import {
  ListPostsQuery,
  GetPostQuery,
  Post,
  CreateCommentMutation,
  CreateCommentInput,
  Comment,
} from "../../API";
import { Button, Container, Grid, TextField } from "@mui/material";
import PostPreview from "../../components/PostPreview";
import PostComment from "../../components/PostComment";
import { useForm, SubmitHandler } from "react-hook-form";
import { createComment } from "../../graphql/mutations";
import { GRAPHQL_AUTH_MODE } from "@aws-amplify/auth";

interface IFormInput {
  comment: string;
}

interface Props {
  post: Post;
}

export default function IndividualPost({ post }: Props): ReactElement {
  const [comments, setComments] = useState<Comment[]>(
    post.comments.items as Comment[]
  );
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<IFormInput>();

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    const createNewCommentInput: CreateCommentInput = {
      postID: post.id,
      content: data.comment,
    };
    const createNewComment = (await API.graphql({
      query: createComment,
      variables: { input: createNewCommentInput },
      authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
    })) as { data: CreateCommentMutation };

    setComments([...comments, createNewComment.data.createComment as Comment]);
  };
  console.log("got post: ", post);
  return (
    <Container maxWidth="md">
      <PostPreview post={post} />
      {/* space for user to put comment */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        autoComplete="off"
        style={{ marginTop: 64 }}
      >
        <Grid container spacing={2} direction="row" alignItems="center">
          <Grid item style={{ flexGrow: 1 }}>
            <TextField
              id="comment"
              variant="filled"
              label="Add a comment"
              type="text"
              multiline
              fullWidth
              error={errors.comment ? true : false}
              helperText={errors.comment ? errors.comment.message : null}
              {...register("comment", {
                required: {
                  value: true,
                  message: "Please enter a comment.",
                },
                maxLength: {
                  value: 240,
                  message:
                    "Please enter a comment under a 240 characters characters.",
                },
              })}
            />
          </Grid>
          <Grid item>
            <Button variant="contained" color="primary" type="submit">
              Add Comment
            </Button>
          </Grid>
        </Grid>
      </form>

      {comments
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((comment) => (
          <PostComment key={comment.id} comment={comment} />
        ))}
    </Container>
  );
}

// This function gets called at build time
export const getStaticPaths: GetStaticPaths = async () => {
  const SSR = withSSRContext();
  const response = (await SSR.API.graphql({ query: listPosts })) as {
    data: ListPostsQuery;
    errors: any[];
  };
  // Get the paths we want to pre-render based on posts
  const paths = response.data.listPosts.items.map((post) => ({
    params: { id: post.id },
  }));
  // We'll pre-render only these paths at build time.
  // { fallback: false } means other routes should 404.
  return { paths, fallback: false };
};

// This also gets called at build time
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const SSR = withSSRContext();

  const postsQuery = (await SSR.API.graphql({
    query: getPost,
    variables: {
      id: params.id,
    },
  })) as { data: GetPostQuery };

  // Pass post data to the page via props
  return {
    props: { post: postsQuery.data.getPost as Post },
  };
};
