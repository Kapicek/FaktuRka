import React from "react";
import { Checkbox, FormControlLabel, Link, Stack, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export const RememberMeCheckbox = () => {
    const theme = useTheme();
    return (
        <FormControlLabel
            label="Remember me"
            control={
                <Checkbox
                    name="remember"
                    value="true"
                    color="primary"
                    sx={{ padding: 0.5 }}
                />
            }
            slotProps={{
                typography: {
                    color: "textSecondary",
                    fontSize: theme.typography.pxToRem(14),
                },
            }}
        />
    );
};

export const SignUpLink = () => (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ pt: 1 }}>
        <Typography variant="body2">Don't have an account?</Typography>
        <Link component={RouterLink} to="/sign-up" variant="body2">
            Sign up
        </Link>
    </Stack>
);

export const ForgotPasswordLink = () => (
    <Link component={RouterLink} to="/forgot-password" variant="body2">
        Forgot password?
    </Link>
);

