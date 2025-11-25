import LinearProgress from "@mui/material/LinearProgress";
import { SignInPage } from "@toolpad/core/SignInPage";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectToken } from "../features/auth/authSlice";
import { useLoginMutation, useGoogleLoginMutation } from "../features/auth/authApi";
import { Box } from "@mui/material";

type Provider = { id: "credentials" | string; name?: string };

declare global {
    interface Window {
        google?: any;
    }
}

export default function SignIn() {
    const token = useSelector(selectToken);
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const callbackUrl = params.get("callbackUrl") || "/";
    const [login] = useLoginMutation();
    const [googleLogin] = useGoogleLoginMutation();

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

            // Inicializace One Tap / Sign-In
            google.accounts.id.initialize({
                client_id: clientId,
                callback: (response: any) => {
                    if (response?.credential) {
                        resolve(response.credential);
                    } else {
                        reject(new Error("Google sign-in nevrátil credential"));
                    }
                },
            });

            // Zobrazí One Tap / výbìr úètu po kliknutí na "Google"
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

                    if (!email || !password) return { error: "Email and password are required" };

                    try {
                        await login({ email, password }).unwrap();
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
