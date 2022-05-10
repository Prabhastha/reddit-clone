import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Alert, Button, Grid, Snackbar, TextField } from "@mui/material";
import { Auth } from "aws-amplify";
import { useUser } from "../context/AuthContext";
import { CognitoUser } from "@aws-amplify/auth";
import router from "next/router";

interface IFormInput {
  username: string;
  email: string;
  password: string;
  code: string;
}

export default function Signup() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [signUpError, setSignUpError] = useState<string>("");
  const [showCode, setShowCode] = useState<boolean>(false);
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<IFormInput>();

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    try {
      if (showCode) {
        confirmSignUp(data);
      } else {
        await signUpWithEmailAndPassword(data);
        setShowCode(true);
      }
    } catch (err) {
      console.error(err);
      setSignUpError(err.message);
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

  async function signUpWithEmailAndPassword(
    data: IFormInput
  ): Promise<CognitoUser> {
    const { username, password, email } = data;
    try {
      const { user } = await Auth.signUp({
        username,
        password,
        attributes: {
          email,
        },
      });
      console.log("signed up a user: ", user);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async function confirmSignUp(data: IFormInput) {
    const { username, password, code } = data;
    try {
      await Auth.confirmSignUp(username, code);
      const amplifyUser = await Auth.signIn(username, password);
      console.log("Success, signed in user ", amplifyUser);
      if (amplifyUser) {
        router.push(`/`);
      } else {
        console.log("something went wrong:");
      }
    } catch (error) {
      console.log("error confirming sign up", error);
    }
  }
  console.log("The value of the user from the hook is: ", user);

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
            {...register("username", {
              required: {
                value: true,
                message: "Please enter a valid username.",
              },
              minLength: {
                value: 3,
                message: "Pleace enter a username between 3-16 characters.",
              },
              maxLength: {
                value: 24,
                message: "Pleace enter a username between 3-16 characters.",
              },
            })}
          />
        </Grid>
        <Grid item>
          <TextField
            id="email"
            variant="filled"
            label="email"
            type="email"
            error={errors.email ? true : false}
            helperText={errors.email ? errors.email.message : null}
            {...register("email", {
              required: { value: true, message: "Please enter a valid email." },
            })}
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
            {...register("password", {
              required: { value: true, message: "Please enter a password." },
              minLength: {
                value: 3,
                message: "Please enter a stronger password.",
              },
            })}
          />
        </Grid>
        {showCode && (
          <Grid item>
            <TextField
              id="code"
              variant="filled"
              label="code"
              type="text"
              error={errors.code ? true : false}
              helperText={errors.code ? errors.code.message : null}
              {...register("code", {
                required: {
                  value: true,
                  message: "Please enter the code.",
                },
                minLength: {
                  value: 6,
                  message: "Your verification code is 6 character long.",
                },
                maxLength: {
                  value: 6,
                  message: "Your verification code is 6 character long.",
                },
              })}
            />
          </Grid>
        )}

        <Grid>
          <Button style={{ margin: 10 }} variant="contained" type="submit">
            {showCode ? "Confirm Code" : "Sign Up"}
          </Button>
        </Grid>
      </Grid>
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="error" sx={{ width: "100%" }}>
          {signUpError}
        </Alert>
      </Snackbar>
    </form>
  );
}
