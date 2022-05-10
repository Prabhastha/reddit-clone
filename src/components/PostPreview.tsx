import { ButtonBase, Grid, IconButton, Paper, Typography } from "@mui/material";
import React, { ReactElement, useEffect, useState } from "react";
import {
  CreateVoteInput,
  CreateVoteMutation,
  Post,
  UpdateVoteInput,
  UpdateVoteMutation,
} from "../API";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import Image from "next/image";
import { useRouter } from "next/router";
import formatDatePosted from "../lib/formatDatePosted";
import { API, Storage } from "aws-amplify";
import { createVote, updateVote } from "../graphql/mutations";
import { GRAPHQL_AUTH_MODE } from "@aws-amplify/auth";
import { useUser } from "../context/AuthContext";

interface Props {
  post: Post;
}

export default function PostPreview({ post }: Props): ReactElement {
  const router = useRouter();
  const { user } = useUser();
  const [postImage, setPostImage] = useState<string | undefined>(undefined);
  const [existingVote, setExistingVote] = useState<string | undefined>(
    undefined
  );
  const [existingVoteId, setExistingVoteId] = useState<string | undefined>(
    undefined
  );
  const [upVotes, setUpVotes] = useState<number>(
    post.votes.items
      ? post.votes.items.filter((v) => v.vote === "upvote").length
      : 0
  );
  const [downVotes, setDownVotes] = useState<number>(
    post.votes.items
      ? post.votes.items.filter((v) => v.vote === "downvote").length
      : 0
  );

  useEffect(() => {
    if (user) {
      const tryFindVote = post.votes.items?.find(
        (v) => v.owner === user.getUsername()
      );

      if (tryFindVote) {
        setExistingVote(tryFindVote.vote);
        setExistingVoteId(tryFindVote.id);
      }
    }
  }, [user]);
  useEffect(() => {
    async function getImageFromStorage() {
      try {
        const signedURL = await Storage.get(post.image); // get key from Storage.list
        console.log("Found the Image ", signedURL);
        setPostImage(signedURL);
      } catch (error) {
        console.log("No Image Found");
      }
    }
    getImageFromStorage();
  }, []);

  const addVote = async (voteType: string) => {
    // if they're changing their vote...
    // updateVote rather than create vote.
    if (existingVote && existingVote != voteType) {
      const updateVoteInput: UpdateVoteInput = {
        id: existingVoteId,
        vote: voteType,
        postID: post.id,
      };

      const updateThisVote = (await API.graphql({
        query: updateVote,
        variables: { input: updateVoteInput },
        authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
      })) as { data: UpdateVoteMutation };

      if (voteType === "upvote") {
        setUpVotes(upVotes + 1);
        setDownVotes(downVotes - 1);
      }
      if (voteType === "downvote") {
        setUpVotes(upVotes - 1);
        setDownVotes(downVotes + 1);
      }
      setExistingVote(voteType);
      setExistingVoteId(updateThisVote.data.updateVote.id);
      console.log("Updated vote ", updateThisVote);
    }
    if (!existingVote) {
      const createNewVoteInput: CreateVoteInput = {
        vote: voteType,
        postID: post.id,
      };

      const createNewVote = (await API.graphql({
        query: createVote,
        variables: { input: createNewVoteInput },
        authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
      })) as { data: CreateVoteMutation };

      if (createNewVote.data.createVote.vote === "downvote") {
        setDownVotes(downVotes + 1);
      }
      if (createNewVote.data.createVote.vote === "upvote") {
        setUpVotes(upVotes + 1);
      }
      setExistingVote(voteType);
      setExistingVoteId(createNewVote.data.createVote.id);
      console.log("Created vote:", createNewVote);
    }
  };
  console.log(post);
  console.log("Upvotes:", upVotes);
  console.log("Downvotes:", downVotes);
  return (
    <Paper elevation={6}>
      <Grid
        container
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start"
        wrap="nowrap"
        spacing={3}
        style={{ padding: 12, marginTop: 24 }}
      >
        {/* Upvote votes downvote */}
        <Grid item spacing={1} alignItems="center">
          <Grid container direction="column" alignItems="center">
            <Grid item>
              <IconButton color="inherit" onClick={() => addVote("upvote")}>
                <ArrowUpwardIcon />
              </IconButton>
            </Grid>
            <Grid item>
              <Grid container alignItems="center" direction="column">
                <Grid item>
                  <Typography variant="body1">{upVotes - downVotes}</Typography>
                </Grid>
                <Grid item>
                  <Typography variant="body2">Votes</Typography>
                </Grid>
              </Grid>
            </Grid>
            <Grid item>
              <IconButton color="inherit" onClick={() => addVote("downvote")}>
                <ArrowDownwardIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Grid>

        {/* Content Preview */}
        <Grid item>
          <ButtonBase onClick={() => router.push(`/post/${post.id}`)}>
            <Grid container direction="column" alignItems="flex-start">
              <Grid item>
                <Typography variant="body1">
                  Posted by <b>{post.owner} </b>
                  {formatDatePosted(post.createdAt)} hours ago
                </Typography>
              </Grid>

              <Grid item>
                <Typography variant="h2">{post.title}</Typography>
              </Grid>
              <Grid
                item
                style={{
                  maxHeight: 32,
                  overflowY: "hidden",
                  overflowX: "hidden",
                }}
              >
                <Typography variant="body1">{post.content}</Typography>
              </Grid>
              {/* {!post.image && ( */}
              {post.image && postImage && (
                <Grid item>
                  <Image
                    src={postImage}
                    height={540}
                    width={980}
                    layout="intrinsic"
                  />
                </Grid>
              )}

              {/* )} */}
            </Grid>
          </ButtonBase>
        </Grid>
      </Grid>
    </Paper>
  );
}
