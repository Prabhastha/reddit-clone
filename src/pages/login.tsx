import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Alert, Button, Grid, Snackbar, TextField } from "@mui/material";
import { Auth } from "aws-amplify";
import { useRouter } from "next/router";

interface IFormInput {
  username: string;
  password: string;
}

export default function Login() {
  const [signInError, setSignInError] = useState<string>("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<IFormInput>();

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    try {
      await Auth.signIn(data.username, data.password);
      router.push(`/`);
    } catch (error) {
      setSignInError(error.message);
      setOpen(true);
    }
  };
  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
      <Grid
        container
        direction="column"
        alignItems="center"
        justifyContent="center"
        spacing={2}
      >
        <Grid item>
          <TextField
            id="username"
            variant="filled"
            label="username"
            type="text"
            error={errors.username ? true : false}
            helperText={errors.username ? errors.username.message : null}
            {...register("username")}
          />
        </Grid>

        <Grid item>
          <TextField
            id="password"
            variant="filled"
            label="password"
            type="password"
            error={errors.password ? true : false}
            helperText={errors.password ? errors.password.message : null}
            {...register("password")}
          />
        </Grid>

        <Grid>
          <Button style={{ marginTop: 5 }} variant="contained" type="submit">
            Sign In
          </Button>
        </Grid>
      </Grid>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="error" sx={{ width: "100%" }}>
          {signInError}
        </Alert>
      </Snackbar>
    </form>
  );
}
