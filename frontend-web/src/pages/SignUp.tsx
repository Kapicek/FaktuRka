import React from "react";
import {
    Button,
    Card,
    CardContent,
    Grid,
    Stack,
    TextField,
    Typography,
    useColorScheme,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegisterMutation } from "../features/auth/authApi";

const registerSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const SignUp: React.FC = () => {
    const navigate = useNavigate();
    const { colorScheme } = useColorScheme();
    const [registerUser, { isLoading }] = useRegisterMutation();
    const {
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values: RegisterFormValues) => {
        try {
            await registerUser(values).unwrap();
            navigate("/sign-in", { replace: true });
        } catch (e) {
            console.error("Registration failed", e);
        }
    };

    return (
        <Stack
            direction="column"
            spacing={2}
            alignItems="center"
            justifyContent="center"
            sx={{ minHeight: "100vh", p: 3 }}
        >
            <Card
                variant="outlined"
                sx={{
                    width: "100%",
                    maxWidth: 520,
                    borderRadius: 2,
                    borderColor: "divider",
                    bgcolor: colorScheme === "light" ? "background.default" : "#1f1f1f",
                }}
            >
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        <Stack spacing={3}>
                            <Stack spacing={0.5}>
                                <Typography variant="h5" fontWeight={600}>
                                    Create an account
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Already have an account?{" "}
                                    <Typography
                                        component={RouterLink}
                                        to="/sign-in"
                                        color="primary"
                                        sx={{ textDecoration: "none" }}
                                    >
                                        Sign in
                                    </Typography>
                                </Typography>
                            </Stack>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Controller
                                        name="firstName"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="First name *"
                                                fullWidth
                                                error={!!errors.firstName}
                                                helperText={errors.firstName?.message}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Controller
                                        name="lastName"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Last name *"
                                                fullWidth
                                                error={!!errors.lastName}
                                                helperText={errors.lastName?.message}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="email"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Email *"
                                                type="email"
                                                fullWidth
                                                error={!!errors.email}
                                                helperText={errors.email?.message}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <Controller
                                        name="password"
                                        control={control}
                                        render={({ field }) => (
                                            <TextField
                                                {...field}
                                                label="Password *"
                                                type="password"
                                                fullWidth
                                                error={!!errors.password}
                                                helperText={errors.password?.message}
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isLoading}
                                sx={{ textTransform: "none" }}
                            >
                                {isLoading ? "Registering..." : "Sign up"}
                            </Button>
                        </Stack>
                    </form>
                </CardContent>
            </Card>
        </Stack>
    );
};

export default SignUp;
