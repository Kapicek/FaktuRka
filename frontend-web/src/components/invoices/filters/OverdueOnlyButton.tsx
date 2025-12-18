import React from "react";
import { Button, Stack } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

type Props = {
    value: boolean;
    onToggle: () => void;
};

export const OverdueOnlyButton = ({ value, onToggle }: Props) => {
    return (
        <Stack spacing={1}>
            <Button
                variant="outlined"
                color={value ? "primary" : "inherit"}
                startIcon={<WarningAmberIcon fontSize="small" />}
                onClick={onToggle}
                sx={{
                    textTransform: "none",
                    height: 40,
                    backgroundColor: "background.default",
                }}
            >
                Overdue
            </Button>
        </Stack>
    );
};

