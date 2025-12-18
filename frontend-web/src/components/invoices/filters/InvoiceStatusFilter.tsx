import React from "react";
import { Autocomplete, Stack, TextField, Typography } from "@mui/material";
import type { InvoiceStatus } from "../statusConfig";
import { STATUS_CONFIG } from "../statusConfig";

type StatusOption = {
    value: InvoiceStatus;
    label: string;
    chip: (typeof STATUS_CONFIG)[InvoiceStatus];
};

const statusOptions: StatusOption[] = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    value: Number(key) as InvoiceStatus,
    label: cfg.label,
    chip: cfg,
}));

type Props = {
    value: InvoiceStatus | undefined;
    onChange: (next: InvoiceStatus | undefined) => void;
};

export const InvoiceStatusFilter = ({ value, onChange }: Props) => {
    return (
        <Stack spacing={1}>
            <Autocomplete<StatusOption, false, false, false>
                options={statusOptions}
                value={value !== undefined ? statusOptions.find((opt) => opt.value === value) ?? null : null}
                onChange={(_, newValue) => onChange(newValue?.value)}
                getOptionLabel={(option) => option.label}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Status"
                        size="small"
                        sx={{ backgroundColor: "background.default" }}
                    />
                )}
                renderOption={(props, option) => {
                    const Icon = option.chip.icon;
                    return (
                        <li {...props} key={option.value}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Icon
                                    fontSize="small"
                                    color={option.chip.color === "default" ? "inherit" : option.chip.color}
                                />
                                <Typography variant="body2">{option.label}</Typography>
                            </Stack>
                        </li>
                    );
                }}
                clearOnEscape
            />
        </Stack>
    );
};

