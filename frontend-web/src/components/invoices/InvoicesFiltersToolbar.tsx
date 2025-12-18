import React from "react";
import {
    Grid,
    Stack,
} from "@mui/material";
import type { Customer } from "../../features/customers/customersApi";
import type { InvoicesFiltersState } from "./filterTypes";
import { InvoiceCustomerFilter } from "./filters/InvoiceCustomerFilter";
import { InvoicePeriodFilter } from "./filters/InvoicePeriodFilter";
import { InvoiceStatusFilter } from "./filters/InvoiceStatusFilter";
import { OverdueOnlyButton } from "./filters/OverdueOnlyButton";

type Props = {
    filters: InvoicesFiltersState;
    onChange: (next: InvoicesFiltersState) => void;
    customers: Customer[];
    customersLoading: boolean;
};

export const InvoicesFiltersToolbar = ({
    filters,
    onChange,
    customers,
    customersLoading,
}: Props) => {
    return (
        <Stack direction="row" spacing={2} mb={2} flexShrink={0} alignItems="flex-start">
            <Grid container spacing={2} sx={{ flex: 1 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <InvoiceStatusFilter
                        value={filters.status}
                        onChange={(nextStatus) =>
                            onChange({
                                ...filters,
                                status: nextStatus,
                            })
                        }
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <InvoiceCustomerFilter
                        customers={customers}
                        customersLoading={customersLoading}
                        value={filters.customerId}
                        onChange={(nextCustomerId) =>
                            onChange({
                                ...filters,
                                customerId: nextCustomerId,
                            })
                        }
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <InvoicePeriodFilter
                        periodType={filters.periodType}
                        periodValue={filters.periodValue}
                        onChange={({ periodType, periodValue }) =>
                            onChange({
                                ...filters,
                                periodType,
                                periodValue,
                            })
                        }
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <OverdueOnlyButton
                        value={Boolean(filters.overdueOnly)}
                        onToggle={() =>
                            onChange({
                                ...filters,
                                overdueOnly: !filters.overdueOnly,
                            })
                        }
                    />
                </Grid>
            </Grid>
        </Stack>
    );
};
