import React from "react";
import {
    Autocomplete,
    Grid,
    Stack,
    TextField,
    Typography,
    Button,
} from "@mui/material";
import type { Customer } from "../../features/customers/customersApi";
import type { InvoiceStatus } from "./statusConfig";
import { STATUS_CONFIG } from "./statusConfig";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ClearIcon from "@mui/icons-material/Clear";

type Filters = {
    status?: InvoiceStatus;
    customerId?: number;
    periodDate?: string;
    overdueOnly?: boolean;
};

type Props = {
    filters: Filters;
    onChange: (next: Filters) => void;
    customers: Customer[];
    customersLoading: boolean;
};

const statusOptions = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    value: Number(key) as InvoiceStatus,
    label: cfg.label,
    chip: cfg,
}));

export const InvoicesFiltersToolbar = ({
    filters,
    onChange,
    customers,
    customersLoading,
}: Props) => (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Stack
            direction="row"
            spacing={2}
            mb={2}
            flexShrink={0}
            alignItems="flex-start"
        >
            <Grid container spacing={2} sx={{ flex: 1 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Stack spacing={1}>
                        <Autocomplete<typeof statusOptions[number], false, false, false>
                            options={statusOptions}
                            value={
                                filters.status !== undefined
                                    ? statusOptions.find((opt) => opt.value === filters.status) ?? null
                                    : null
                            }
                            onChange={(_, newValue) =>
                                onChange({
                                    ...filters,
                                    status: newValue?.value,
                                })
                            }
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
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Stack spacing={1}>
                        <Autocomplete<Customer, false, false, false>
                            options={customers}
                            loading={customersLoading}
                            getOptionLabel={(option) => option.name ?? `#${option.id}`}
                            value={
                                filters.customerId
                                    ? customers.find((c) => c.id === filters.customerId) ?? null
                                    : null
                            }
                            onChange={(_, newValue) =>
                                onChange({
                                    ...filters,
                                    customerId: newValue?.id,
                                })
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Customer"
                                    size="small"
                                    sx={{ backgroundColor: "background.default" }}
                                />
                            )}
                            clearOnEscape
                        />
                    </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Stack spacing={1}>
                        <DatePicker
                            label="Issue Date"
                            views={["year", "month", "day"]}
                            value={filters.periodDate ? dayjs(filters.periodDate) : null}
                            onChange={(value) =>
                                onChange({
                                    ...filters,
                                    periodDate: value ? value.format("YYYY-MM-DD") : undefined,
                                })
                            }
                            slots={{
                                clearIcon: ClearIcon,
                            }}
                            slotProps={{
                                textField: {
                                    size: "small",
                                    sx: {
                                        backgroundColor: "background.default",
                                    },
                                },
                                actionBar: {
                                    actions: ["clear"],
                                },
                            }}
                        />
                    </Stack>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Stack spacing={1}>
                        <Button
                            variant="outlined"
                            color={filters.overdueOnly ? "primary" : "inherit"}
                            startIcon={<WarningAmberIcon fontSize="small" />}
                            onClick={() =>
                                onChange({
                                    ...filters,
                                    overdueOnly: !filters.overdueOnly,
                                })
                            }
                            sx={{
                                textTransform: "none",
                                height: 40,
                                backgroundColor: "background.default",
                            }}
                        >
                            Overdue
                        </Button>
                    </Stack>
                </Grid>
            </Grid>
        </Stack>
    </LocalizationProvider>
);
