import { Box, Stack } from "@mui/material";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectToken } from "../features/auth/authSlice";
import authImage from "../assets/Auth-Image.png";
import { VerifyEmailForm } from "../components/auth/VerifyEmailForm";

export default function VerifyEmail() {
    const token = useSelector(selectToken);
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const callbackUrl = params.get("callbackUrl") || "/";
    const email = params.get("email") ?? undefined;

    useEffect(() => {
        if (token) {
            navigate(callbackUrl, { replace: true });
        }
    }, [token, callbackUrl, navigate]);

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

            <VerifyEmailForm initialEmail={email} onSuccess={() => navigate(callbackUrl, { replace: true })} />
        </Stack>
    );
}

