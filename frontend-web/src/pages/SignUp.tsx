import {
    Box,
    Button,
    Stack,
    TextField,
    Typography,
    Link,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import React from "react";
import { useRegisterMutation } from "../features/auth/authApi";

const SignUp: React.FC = () => {
    const navigate = useNavigate();
    const [registerUser, { isLoading }] = useRegisterMutation();
    const [error, setError] = React.useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const firstName = (data.get("firstName") as string)?.trim();
        const lastName = (data.get("lastName") as string)?.trim();
        const email = (data.get("email") as string)?.trim();
        const password = data.get("password") as string;

        if (!firstName || !lastName || !email || !password) {
            setError("All fields are required.");
            return;
        }

        try {
            await registerUser({ firstName, lastName, email, password }).unwrap();
            navigate("/sign-in", { replace: true });
        } catch (e: unknown) {
            const anyErr = e as { data?: any; message?: string };
            const msg =
                anyErr?.data?.message ??
                anyErr?.data?.error ??
                anyErr?.message ??
                "Registration failed";
            setError(String(msg));
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                width: "100vw",
                bgcolor: "background.paper",
                padding: 2,
            }}
        >
            <Stack
                component="form"
                spacing={2}
                sx={{ width: "100%", maxWidth: 360 }}
                onSubmit={handleSubmit}
            >
                <Typography variant="h5" fontWeight={600}>
                    Create an account
                </Typography>
                <TextField label="First name" name="firstName" required fullWidth />
                <TextField label="Last name" name="lastName" required fullWidth />
                <TextField
                    label="Email"
                    name="email"
                    type="email"
                    required
                    fullWidth
                />
                <TextField
                    label="Password"
                    name="password"
                    type="password"
                    required
                    fullWidth
                />
                {error && (
                    <Typography color="error" variant="body2">
                        {error}
                    </Typography>
                )}
                <Button type="submit" variant="contained" disabled={isLoading}>
                    {isLoading ? "Registering..." : "Sign up"}
                </Button>
                <Typography variant="body2" textAlign="center">
                    Already have an account?{" "}
                    <Link component={RouterLink} to="/sign-in">
                        Sign in
                    </Link>
                </Typography>
            </Stack>
        </Box>
    );
};

export default SignUp;
