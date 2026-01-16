import React from "react";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useResendVerificationMutation, useVerifyEmailMutation } from "../../features/auth/authApi";
import { verifyEmailDefaultValues, verifyEmailSchema, type VerifyEmailFormValues } from "../../utils/verifyEmail/schema";

type Props = {
    title?: string;
    initialEmail?: string;
    onSuccess?: () => void;
};

export const VerifyEmailForm = ({ title = "Verify email", initialEmail, onSuccess }: Props) => {
    const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
    const [resendVerification, { isLoading: isResending }] = useResendVerificationMutation();
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [submitInfo, setSubmitInfo] = React.useState<string | null>(null);
    const [emailValue, setEmailValue] = React.useState<string>(initialEmail ?? "");

    const {
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm<VerifyEmailFormValues>({
        resolver: zodResolver(verifyEmailSchema),
        defaultValues: {
            ...verifyEmailDefaultValues,
            email: initialEmail ?? verifyEmailDefaultValues.email,
        },
    });

    React.useEffect(() => {
        if (initialEmail) {
            setEmailValue(initialEmail);
            setValue("email", initialEmail, { shouldValidate: true });
        }
    }, [initialEmail, setValue]);

    const onSubmit = async (values: VerifyEmailFormValues) => {
        setSubmitError(null);
        setSubmitInfo(null);
        try {
            await verifyEmail(values).unwrap();
            onSuccess?.();
        } catch (err) {
            const anyErr = err as { data?: unknown; message?: string };
            const data = anyErr?.data;
            const message =
                typeof data === "string"
                    ? data
                    : (data as { message?: string; error?: string } | undefined)?.message ??
                      (data as { message?: string; error?: string } | undefined)?.error ??
                      anyErr?.message ??
                      "Email verification failed";
            setSubmitError(String(message));
        }
    };

    const onResend = async () => {
        setSubmitError(null);
        setSubmitInfo(null);
        try {
            await resendVerification({ email: emailValue }).unwrap();
            setSubmitInfo("Verification code has been sent (if the account exists).");
        } catch (err) {
            const anyErr = err as { data?: unknown; message?: string };
            const data = anyErr?.data;
            const message =
                typeof data === "string"
                    ? data
                    : (data as { message?: string; error?: string } | undefined)?.message ??
                      (data as { message?: string; error?: string } | undefined)?.error ??
                      anyErr?.message ??
                      "Failed to resend verification code";
            setSubmitError(String(message));
        }
    };

    return (
        <Stack direction="column" sx={{ width: 360, height: "100vh", justifyContent: "center", mx: 5.2 }}>
            <Typography variant="h5" fontWeight={600} textAlign="center" sx={{ mb: 1 }}>
                {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
                Enter the 6-digit code from your email to finish registration.
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Stack spacing={2}>
                    {submitError && <Alert severity="error">{submitError}</Alert>}
                    {submitInfo && <Alert severity="success">{submitInfo}</Alert>}

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
                                autoComplete="email"
                                onChange={(e) => {
                                    setEmailValue(e.target.value);
                                    field.onChange(e);
                                }}
                            />
                        )}
                    />

                    <Controller
                        name="code"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Verification code"
                                fullWidth
                                required
                                error={!!errors.code}
                                helperText={errors.code?.message}
                                inputProps={{
                                    inputMode: "numeric",
                                    pattern: "[0-9]*",
                                    maxLength: 6,
                                    autoComplete: "one-time-code",
                                }}
                                onChange={(e) => {
                                    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6);
                                    field.onChange(cleaned);
                                }}
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
                        {isLoading ? "Verifying..." : "Verify"}
                    </Button>

                    <Button
                        type="button"
                        variant="outlined"
                        fullWidth
                        disabled={isResending || !emailValue}
                        onClick={onResend}
                        sx={{ textTransform: "none", py: 1.5 }}
                    >
                        {isResending ? "Sending..." : "Resend code"}
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
