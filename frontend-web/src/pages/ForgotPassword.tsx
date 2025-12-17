import React from "react";
import { Box, Paper, Typography, TextField, Button, Alert, Link } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useForgotPasswordMutation } from "../features/auth/authApi";

export default function ForgotPassword() {
    const [email, setEmail] = React.useState("");
    const [error, setError] = React.useState<string | null>(null);
    const navigate = useNavigate();
    const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!email.trim()) {
            setError("Email is required");
            return;
        }

        try {
            await forgotPassword({ email: email.trim() }).unwrap();
            navigate("/sign-in?reset=success", { replace: true });
        } catch (err) {
            const anyErr = err as { data?: any; message?: string };
            const message =
                anyErr?.data?.message ??
                anyErr?.data?.error ??
                anyErr?.message ??
                "Failed to request new password";
            setError(String(message));
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                bgcolor: "background.default",
                p: 2,
            }}
        >
            <Paper
                component="form"
                onSubmit={handleSubmit}
                elevation={3}
                sx={{
                    width: "100%",
                    maxWidth: 420,
                    p: 4,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                <Typography variant="h5" component="h1">
                    Forgot password
                </Typography>
                <Typography color="text.secondary" variant="body2">
                    Enter the email tied to your account. We will send a fresh password and then you
                    can sign in again.
                </Typography>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField
                    label="Email"
                    name="email"
                    type="email"
                    fullWidth
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isLoading}
                >
                    {isLoading ? "Sending..." : "Send new password"}
                </Button>
                <Link component={RouterLink} to="/sign-in" variant="body2" textAlign="center">
                    Back to sign in
                </Link>
            </Paper>
        </Box>
    );
}
