import React from "react";
import { Box, Card, Grid, Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";

type AuthLayoutProps = {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    illustrationSrc?: string;
    illustrationAlt?: string;
};

/**
 * Layout for auth screens (sign-in / sign-up).
 * Left side shows an illustration on md+ screens, hidden on small screens.
 * Right side hosts the form content.
 */
export const AuthLayout = ({
    title,
    subtitle,
    children,
    illustrationSrc = "/auth-illustration.svg",
    illustrationAlt = "Onboarding illustration",
}: AuthLayoutProps) => (
    <Grid
        container
        sx={{
            minHeight: "100vh",
            bgcolor: "background.default",
        }}
    >
        <Grid
            item
            xs={12}
            md={6}
            sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                justifyContent: "center",
                p: 4,
                background: (theme: Theme) =>
                    `radial-gradient(circle at 20% 20%, ${theme.palette.primary.light}15, transparent 35%),
                     radial-gradient(circle at 80% 10%, ${theme.palette.secondary.light}18, transparent 35%),
                     radial-gradient(circle at 50% 80%, ${theme.palette.primary.main}12, transparent 40%)`,
            }}
        >
            <Card
                elevation={0}
                sx={{
                    width: "100%",
                    maxWidth: 520,
                    borderRadius: 4,
                    overflow: "hidden",
                    bgcolor: "background.paper",
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
            >
                <Box
                    component="img"
                    src={illustrationSrc}
                    alt={illustrationAlt}
                    sx={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            </Card>
        </Grid>

        <Grid
            item
            xs={12}
            md={6}
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: { xs: 3, md: 6 },
            }}
        >
            <Stack spacing={3} sx={{ width: "100%", maxWidth: 440 }}>
                <Stack spacing={0.5}>
                    <Typography variant="h5" fontWeight={700}>
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Stack>
                {children}
            </Stack>
        </Grid>
    </Grid>
);
