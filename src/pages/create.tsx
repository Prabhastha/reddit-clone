import { Button, Container, Grid, TextField } from "@mui/material";
import React, { ReactElement, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import ImageDropZone from "../components/ImageDropZone";
import { API, Storage } from "aws-amplify";
import { v4 as uuidv4 } from "uuid";
import { createPost } from "../graphql/mutations";
import { CreatePostInput, CreatePostMutation } from "../API";
import router from "next/router";
import { GRAPHQL_AUTH_MODE } from "@aws-amplify/auth";

interface IFormInput {
  title: string;
  content: string;
  image?: string;
}

interface Props {}

export default function Create({}: Props): ReactElement {
  const [file, setFile] = useState<File>();
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<IFormInput>();

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    console.log(data);
    console.log(file);

    // User uploaded file
    if (file) {
      // send a request to upload a file to S3 bucket
      const imagePath = uuidv4();
      try {
        await Storage.put(imagePath, file, {
          // contentType: "image/png", // contentType is optional
        });
        // once the file is uploded...
        const createNewPostInput: CreatePostInput = {
          title: data.title,
          content: data.content,
          image: imagePath,
        };
        const createNewPost = (await API.graphql({
          query: createPost,
          variables: { input: createNewPostInput },
          authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
        })) as { data: CreatePostMutation };
        console.log("new post created successfully ", createNewPost);

        router.push(`/post/${createNewPost.data.createPost.id}`);
      } catch (error) {
        console.error("Error uploading file: ", error);
      }
    } else {
      const createNewPostInputWithoutImage: CreatePostInput = {
        title: data.title,
        content: data.content,
      };
      const createNewPostWithoutImage = (await API.graphql({
        query: createPost,
        variables: { input: createNewPostInputWithoutImage },
        authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
      })) as { data: CreatePostMutation };
      console.log("new post created successfully ", createNewPostWithoutImage);

      router.push(`/post/${createNewPostWithoutImage.data.createPost.id}`);
    }
  };

  return (
    <Container maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
        <Grid container spacing={2} direction="column">
          <Grid item>
            <TextField
              id="title"
              variant="outlined"
              label="title"
              type="text"
              fullWidth
              error={errors.title ? true : false}
              helperText={errors.title ? errors.title.message : null}
              {...register("title", {
                required: {
                  value: true,
                  message: "Please enter a title.",
                },

                maxLength: {
                  value: 120,
                  message:
                    "Pleace enter a title that is 120 characters or less.",
                },
              })}
            />
          </Grid>
          <Grid item>
            <TextField
              id="content"
              variant="outlined"
              label="content"
              type="text"
              fullWidth
              multiline
              error={errors.content ? true : false}
              helperText={errors.content ? errors.content.message : null}
              {...register("content", {
                required: {
                  value: true,
                  message: "Please enter some content for your post.",
                },

                maxLength: {
                  value: 1000,
                  message:
                    "Pleace make sure your content is 1000 characters or less.",
                },
              })}
            />
          </Grid>
          <Grid item>
            <ImageDropZone file={file} setFile={setFile} />
          </Grid>
          <Button variant="contained" type="submit">
            Create Post
          </Button>
        </Grid>
      </form>
    </Container>
  );
}
