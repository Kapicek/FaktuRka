import type { InvoiceStatus } from "./statusConfig";

export type PeriodType = "day" | "month" | "year";

export type InvoicesFiltersState = {
    status?: InvoiceStatus;
    customerId?: number;
    periodType: PeriodType;
    periodValue?: string;
    overdueOnly?: boolean;
};
