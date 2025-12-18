import type { ChipProps, Theme } from "@mui/material";
import { CURRENCY_RATES } from "../../../constants/currencies";
import type { InvoiceStatus } from "../../../features/invoices/invoicesApi";
import { STATUS_CONFIG } from "../statusConfig";

export const getCurrencyRate = (code?: string) => {
    if (!code) return 1;
    return CURRENCY_RATES[code] ?? 1;
};

export const convertAmount = (value: number, fromCurrency: string | undefined, toCurrency: string) => {
    const fromRate = getCurrencyRate(fromCurrency);
    const toRate = getCurrencyRate(toCurrency);
    if (toRate === 0) return value;
    return (value * fromRate) / toRate;
};

export const STATUS_FILTER_OPTIONS = Object.entries(STATUS_CONFIG).map(([key, config]) => ({
    label: config.label,
    value: Number(key) as InvoiceStatus,
    chip: config,
}));

export const getStatusColor = (theme: Theme, chipColor: ChipProps["color"]) => {
    if (chipColor === "default" || !chipColor) {
        return theme.palette.mode === "dark" ? "#FFFFFF" : theme.palette.grey[600];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colorFromPalette = (theme.palette as any)[chipColor]?.main;
    return colorFromPalette ?? theme.palette.primary.main;
};

