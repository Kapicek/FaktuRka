import React from "react";
import { Autocomplete, Stack, TextField } from "@mui/material";
import type { Customer } from "../../../features/customers/customersApi";

type Props = {
    customers: Customer[];
    customersLoading: boolean;
    value: number | undefined;
    onChange: (next: number | undefined) => void;
};

export const InvoiceCustomerFilter = ({ customers, customersLoading, value, onChange }: Props) => {
    return (
        <Stack spacing={1}>
            <Autocomplete<Customer, false, false, false>
                options={customers}
                loading={customersLoading}
                getOptionLabel={(option) => option.name ?? `#${option.id}`}
                value={value ? customers.find((c) => c.id === value) ?? null : null}
                onChange={(_, newValue) => onChange(newValue?.id)}
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
    );
};

