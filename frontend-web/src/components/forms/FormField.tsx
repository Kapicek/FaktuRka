import React from "react";
import { Stack, Typography } from "@mui/material";

type Props = {
    label: React.ReactNode;
    children: React.ReactNode;
};

export const FormField = ({ label, children }: Props) => (
    <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
        <Typography variant="body2" color="text.secondary" lineHeight={1}>
            {label}
        </Typography>
        {children}
    </Stack>
);

