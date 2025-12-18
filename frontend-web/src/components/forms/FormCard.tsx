import React from "react";
import { Card, CardContent, Stack, Typography, useColorScheme } from "@mui/material";
import type { CardContentProps, CardProps } from "@mui/material";

type Props = {
    title?: React.ReactNode;
    children: React.ReactNode;
    contentProps?: CardContentProps;
} & CardProps;

export const FormCard = ({ title, children, contentProps, sx, ...cardProps }: Props) => {
    const { colorScheme } = useColorScheme();

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 2,
                borderColor: "divider",
                transition: "border-color 0.2s ease-in-out",
                bgcolor: colorScheme === "light" ? "background.default" : "#1f1f1f",
                ...sx,
            }}
            {...cardProps}
        >
            <CardContent {...contentProps}>
                <Stack direction="column" spacing={2} sx={{ flex: 1 }}>
                    {title && (
                        <Typography variant="subtitle1" fontWeight={800}>
                            {title}
                        </Typography>
                    )}
                    {children}
                </Stack>
            </CardContent>
        </Card>
    );
};

