import React from "react";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForgotPasswordMutation } from "../../features/auth/authApi";
import {
    forgotPasswordDefaultValues,
    forgotPasswordSchema,
    type ForgotPasswordFormValues,
} from "../../utils/forgotPassword/schema";

type Props = {
    title?: string;
    onSuccess?: () => void;
};

export const ForgotPasswordForm = ({ title = "Forgot password", onSuccess }: Props) => {
    const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
    const [submitError, setSubmitError] = React.useState<string | null>(null);

    const {
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: forgotPasswordDefaultValues,
    });

    const onSubmit = async (values: ForgotPasswordFormValues) => {
        setSubmitError(null);
        try {
            await forgotPassword(values).unwrap();
            onSuccess?.();
        } catch (err) {
            const anyErr = err as { data?: unknown; message?: string };
            const data = anyErr?.data as { message?: string; error?: string } | undefined;
            const message = data?.message ?? data?.error ?? anyErr?.message ?? "Failed to request new password";
            setSubmitError(String(message));
        }
    };

    return (
        <Stack direction="column" sx={{ width: 360, height: "100vh", justifyContent: "center", mx: 5.2 }}>
            <Typography variant="h5" fontWeight={600} textAlign="center" sx={{ mb: 1 }}>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
                Enter the email tied to your account.
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Stack spacing={2}>
                    {submitError && <Alert severity="error">{submitError}</Alert>}
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Email"
                                type="email"
                                fullWidth
                                required
                                error={!!errors.email}
                                helperText={errors.email?.message}
                            />
                        )}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        disabled={isLoading}
                        disableElevation
                        sx={{ textTransform: "none", py: 1.5 }}
                    >
                        {isLoading ? "Sending..." : "Send"}
                    </Button>

                    <Box
                        component={RouterLink}
                        to="/sign-in"
                        sx={{ textAlign: "center", color: "primary.main", textDecoration: "none", pt: 1 }}
                    >
                        Back to sign in
                    </Box>
                </Stack>
            </form>
        </Stack>
    );
};

