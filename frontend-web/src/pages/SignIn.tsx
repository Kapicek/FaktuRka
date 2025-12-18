import LinearProgress from "@mui/material/LinearProgress";
import { SignInPage } from "@toolpad/core/SignInPage";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, selectToken } from "../features/auth/authSlice";
import { useLoginMutation, useGoogleLoginMutation } from "../features/auth/authApi";
import { Box, Stack } from "@mui/material";
import { useEffect, useMemo } from "react";
import { baseApi } from "../features/api/baseApi";
import { RememberMeCheckbox, SignUpLink, ForgotPasswordLink } from "../utils/signIn/slots";
import { createSignInHandler } from "../utils/signIn/createSignInHandler";
import authImage from "../assets/Auth-Image.png";
import { RegistrationForm } from "../components/auth/RegistrationForm";
import { ForgotPasswordForm } from "../components/auth/ForgotPasswordForm";

export default function SignIn() {
    const token = useSelector(selectToken);
    const dispatch = useDispatch();
    const [params] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();
    const callbackUrl = params.get("callbackUrl") || "/";
    const [login] = useLoginMutation();
    const [googleLogin] = useGoogleLoginMutation();
    const isRegistration = location.pathname === "/sign-up";
    const isForgotPassword = location.pathname === "/forgot-password";

    useEffect(() => {
        dispatch(logout());
        dispatch(baseApi.util.resetApiState());
    }, [dispatch]);

    useEffect(() => {
        if (token) {
            navigate(callbackUrl, { replace: true });
        }
    }, [token, callbackUrl, navigate]);

    const signIn = useMemo(
        () =>
            createSignInHandler({
                callbackUrl,
                login,
                googleLogin,
                navigate,
            }),
        [callbackUrl, login, googleLogin, navigate]
    );

    if (token === undefined) return <LinearProgress />;
    if (token) return null;

    return (
        <Stack
            direction="row"
            sx={{
                bgcolor: "background.default",
                minHeight: "100vh",
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Stack
                direction={"row"}
                sx={{
                    display: { xs: "none", md: "flex" },
                    alignItems: "center",
                    justifyContent: "center",
                    pr: 6,
                    width: 600,
                    height: 700,
                    overflow: "hidden",
                    borderRadius: 3,
                }}
            >
                <Box
                    component="img"
                    src={authImage}
                    alt="Auth"
                    sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                    }}
                />
            </Stack>
            {isForgotPassword ? (
                <ForgotPasswordForm onSuccess={() => navigate("/sign-in?reset=success", { replace: true })} />
            ) : isRegistration ? (
                <RegistrationForm title="Registration" />
            ) : (
                <Stack direction="column">
                    <SignInPage
                        providers={[
                            { id: "google", name: "Google" },
                            { id: "credentials", name: "Email & password" },
                        ]}
                        slots={{
                            signUpLink: SignUpLink,
                            rememberMe: RememberMeCheckbox,
                            forgotPasswordLink: ForgotPasswordLink,
                        }}
                        signIn={signIn}
                        slotProps={{
                            submitButton: {
                                sx: {
                                    textTransform: "none",
                                    mt: 2,
                                    py: 1.5,
                                    backgroundColor: "primary.main",
                                    color: (theme) => theme.palette.primary.contrastText,
                                },
                            },
                            oAuthButton: {
                                sx: {
                                    textTransform: "none",
                                    mt: 2,
                                    py: 1.5,
                                },
                            },
                        }}
                        sx={{
                            "& .MuiBox-root": {
                                width: 360,
                            },
                            "& .MuiStack-root": {
                                boxShadow: "none",
                                border: "none",
                            },
                            "& .MuiInputBase-input": {
                                py: 2,
                            },
                        }}
                    />
                </Stack>
            )}
        </Stack>
    );
}
