import LinearProgress from "@mui/material/LinearProgress";
import { SignInPage } from "@toolpad/core/SignInPage";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectToken } from "../features/auth/authSlice";
import { useLoginMutation, useGoogleLoginMutation } from "../features/auth/authApi";
import { Box, Checkbox, FormControlLabel, Link, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useEffect } from "react";
import { baseApi } from "../features/api/baseApi";

type Provider = { id: "credentials" | string; name?: string };

declare global {
    interface Window {
        google?: any;
    }
}

const RememberMeCheckbox = () => {
    const theme = useTheme();
    return (
        <FormControlLabel
            label="Remember me"
            control={
                <Checkbox
                    name="remember"
                    value="true"
                    color="primary"
                    sx={{ padding: 0.5, '& .MuiSvgIcon-root': { fontSize: 20 } }}
                />
            }
            slotProps={{
                typography: {
                    color: 'textSecondary',
                    fontSize: theme.typography.pxToRem(14),
                },
            }}
        />
    );
}

const SignUpLink = () => (
    <Link component={RouterLink} to="/sign-up" variant="body2">
        Sign up
    </Link>
);

const ForgotPasswordLink = () => {
    return (
        <Link href="/" variant="body2">
            Forgot password?
        </Link>
    );
}

export default function SignIn() {
    const token = useSelector(selectToken);
    const dispatch = useDispatch();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const callbackUrl = params.get("callbackUrl") || "/";
    const [login] = useLoginMutation();
    const [googleLogin] = useGoogleLoginMutation();

    useEffect(() => {
        dispatch(logout());
        dispatch(baseApi.util.resetApiState());
    }, [dispatch]);

    if (token === undefined) return <LinearProgress />;
    if (token) {
        navigate(callbackUrl, { replace: true });
        return null;
    }

    const getGoogleIdToken = (): Promise<string> => {
        return new Promise((resolve, reject) => {
            const google = window.google;

            if (!google?.accounts?.id) {
                reject(new Error("Google SDK was not loaded"));
                return;
            }

            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            if (!clientId) {
                reject(new Error("missing VITE_GOOGLE_CLIENT_ID "));
                return;
            }

            // Sign-In
            google.accounts.id.initialize({
                client_id: clientId,
                callback: (response: any) => {
                    if (response?.credential) {
                        resolve(response.credential);
                    } else {
                        reject(new Error("Google sign-in nevr�til credential"));
                    }
                },
            });

            // Google
            google.accounts.id.prompt((notification: any) => {
                const notDisplayedReason = notification.getNotDisplayedReason?.();
                const skippedReason = notification.getSkippedReason?.();

                if (notDisplayedReason || skippedReason) {
                    reject(
                        new Error(
                            `Google sign-in has been canceled (${notDisplayedReason ?? skippedReason})`
                        )
                    );
                }
            });
        });
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
            <SignInPage
                providers={[
                    { id: "credentials", name: "Email & password" },
                    { id: "google", name: "Google" },
                ]}
                slots={{
                    signUpLink: SignUpLink,
                    rememberMe: RememberMeCheckbox,
                    forgotPasswordLink: ForgotPasswordLink,
                }}
                signIn={async (provider: Provider, formData?: FormData, cbUrl?: string) => {
                    const targetUrl = cbUrl || callbackUrl || "/";

                    // === GOOGLE PROVIDER ===
                    if (provider.id === "google") {
                        try {
                            const idToken = await getGoogleIdToken();
                            await googleLogin({ idToken }).unwrap();
                            navigate(targetUrl, { replace: true });
                            return {};
                        } catch (e: unknown) {
                            const anyErr = e as { data?: any; message?: string };
                            const msg =
                                anyErr?.data?.message ??
                                anyErr?.data?.error ??
                                anyErr?.message ??
                                "Google login failed";
                            return { error: String(msg) };
                        }
                    }

                    // === CREDENTIALS PROVIDER ===
                    if (provider.id !== "credentials") {
                        return { error: "Unsupported provider" };
                    }

                    const email = (formData?.get("email") as string) ?? "";
                    const password = (formData?.get("password") as string) ?? "";
                    const rememberMe = (formData?.get("remember") as string) === "true";

                    if (!email || !password) return { error: "Email and password are required" };

                    try {
                        await login({ email, password, rememberMe }).unwrap();
                        navigate(targetUrl, { replace: true });
                        return {};
                    } catch (e: unknown) {
                        const anyErr = e as { data?: any; message?: string };
                        const msg =
                            anyErr?.data?.message ??
                            anyErr?.data?.error ??
                            anyErr?.message ??
                            "Login failed";
                        return { error: String(msg) };
                    }
                }}
            />
        </Box>
    );
}
