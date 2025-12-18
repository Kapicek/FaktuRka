import React from "react";
import { Box, Button, Link, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRegisterMutation } from "../../features/auth/authApi";
import { registerDefaultValues, registerSchema, type RegisterFormValues } from "../../utils/signUp/schema";

type Props = {
    title?: string;
};

export const RegistrationForm = ({ title = "Registration" }: Props) => {
    const [registerUser, { isLoading }] = useRegisterMutation();

    const {
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: registerDefaultValues,
    });

    const onSubmit = async (values: RegisterFormValues) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { confirmPassword: _confirmPassword, ...payload } = values;
        await registerUser(payload).unwrap();
    };

    return (
        <Stack direction="column" sx={{ width: 360, height: "100vh", justifyContent: "center", mx: 5.2 }}>
            <Typography variant="h5" textAlign="center" sx={{ mb: 1, fontWeight: 600 }}>
                {title}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ pb: 2 }}>
                <Typography variant="body2" color="text.secondary">Already have an account?</Typography>
                <Link component={RouterLink} to="/sign-in" variant="body2">
                    Sign in
                </Link>
            </Stack>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Stack spacing={2}>
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
                    <Controller
                        name="confirmPassword"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Confirm password *"
                                type="password"
                                fullWidth
                                error={!!errors.confirmPassword}
                                helperText={errors.confirmPassword?.message}
                            />
                        )}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isLoading}
                        disableElevation
                        sx={{ textTransform: "none", mt: 1, py: 1.5 }}
                    >
                        {isLoading ? "Registering..." : "Sign up"}
                    </Button>
                </Stack>
            </form>
        </Stack>
    );
};

