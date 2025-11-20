import LinearProgress from "@mui/material/LinearProgress";
import { SignInPage } from "@toolpad/core/SignInPage";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectToken } from "../features/auth/authSlice";
import { useLoginMutation } from "../features/auth/authApi";
import { Box } from "@mui/material";

type Provider = { id: "credentials" | string; name?: string };

export default function SignIn() {
    const token = useSelector(selectToken);
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const callbackUrl = params.get("callbackUrl") || "/";
    const [login] = useLoginMutation();

    if (token === undefined) return <LinearProgress />;
    if (token) {
        navigate(callbackUrl, { replace: true });
        return null;
    }

    return (
        <Box sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            width: "100vw",
            bgcolor: "background.paper",
            padding: 2,
        }}>

            <SignInPage
                providers={[{ id: "credentials", name: "Credentials" }, { id: 'google', name: 'Google' }]}
                signIn={async (provider: Provider, formData?: FormData, cbUrl?: string) => {
                    if (provider.id !== "credentials") {
                        return { error: "Only credentials are supported" };
                    }
                    const email = (formData?.get("email") as string) ?? "";
                    const password = (formData?.get("password") as string) ?? "";
                    if (!email || !password) return { error: "Email and password are required" };

                    try {
                        const res = await login({ email, password }).unwrap();
                        navigate(cbUrl || callbackUrl || "/", { replace: true });
                        return {};
                    } catch (e: unknown) {
                        const anyErr = e as { data?: any; message?: string };
                        const msg =
                            anyErr?.data?.message ??
                            anyErr?.data?.error ??
                            anyErr?.message ??
                            "Sign-in failed";
                        return { error: String(msg) };
                    }
                }}
            />
        </Box>
    );
}
