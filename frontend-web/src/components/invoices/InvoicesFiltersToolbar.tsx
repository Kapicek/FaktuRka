import React from "react";
import {
    Autocomplete,
    Button,
    Grid,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { FileDownloadRounded } from "@mui/icons-material";
import type { Customer } from "../../features/customers/customersApi";
import type { InvoiceStatus } from "./statusConfig";
import { STATUS_CONFIG } from "./statusConfig";
import type { InvoiceListItem } from "../../features/invoices/invoicesApi";

type Filters = {
    status?: InvoiceStatus;
    customerId?: number;
};

type Props = {
    filters: Filters;
    onChange: (next: Filters) => void;
    customers: Customer[];
    customersLoading: boolean;
    selectedInvoices: InvoiceListItem[];
    isExporting: boolean;
    onExportSelected: () => void;
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
    selectedInvoices,
    isExporting,
    onExportSelected,
}: Props) => (
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
                                placeholder="Status"
                                size="small"
                                sx={{ backgroundColor: "background.default" }}
                            />
                        )}
                        renderOption={(props, option) => {
                            const Icon = option.chip.icon;
                            return (
                                <li {...props} key={option.value}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Icon fontSize="small" />
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
                                placeholder="Customer"
                                size="small"
                                sx={{ backgroundColor: "background.default" }}
                            />
                        )}
                        clearOnEscape
                    />
                </Stack>
            </Grid>
        </Grid>
        <Button
            variant="outlined"
            startIcon={<FileDownloadRounded />}
            disabled={!selectedInvoices.length || isExporting}
            sx={{ textTransform: "none" }}
            onClick={onExportSelected}
        >
            {isExporting ? "Exporting..." : "Export selected"}
        </Button>
    </Stack>
);
