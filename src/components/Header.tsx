import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import AppleIcon from "@mui/icons-material/Menu";
import { useUser } from "../context/AuthContext";
import { Button, Menu, MenuItem, Tooltip } from "@mui/material";
import { useRouter } from "next/router";
import { AccountCircle } from "@mui/icons-material";
import { Auth } from "aws-amplify";
import AddIcon from "@mui/icons-material/Add";

export default function Header() {
  const { user } = useUser();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const signUserOut = async () => {
    await Auth.signOut();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="inherit">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => router.push(`/`)}
          >
            <AppleIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Reddit Clone
          </Typography>
          {user && (
            <div>
              <Tooltip title="create post">
                <IconButton
                  onClick={() => router.push(`/create`)}
                  aria-label="create"
                  color="inherit"
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>

              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={signUserOut}>Sign Out</MenuItem>
              </Menu>
            </div>
          )}
          {!user && (
            <>
              <Button
                style={{ margin: 5 }}
                variant="outlined"
                onClick={() => router.push(`/login`)}
              >
                Log In
              </Button>
              <Button
                style={{ margin: 5 }}
                variant="contained"
                color="primary"
                onClick={() => router.push(`/signup`)}
              >
                Sign Up
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
}
