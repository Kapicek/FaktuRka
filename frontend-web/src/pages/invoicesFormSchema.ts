import { z } from "zod";
import type { CurrencyOption } from "../constants/currencies";

export type TaxModeOption = {
    value: number;
    label: string;
};

export const taxModeOptions: TaxModeOption[] = [
    { value: 0, label: "None" },
    { value: 1, label: "VAT included" },
    { value: 2, label: "VAT excluded" },
];

export type UnitOption = {
    value: string;
    label: string;
};

export const unitOptions: UnitOption[] = [
    { value: "ks", label: "ks" },
    { value: "hour.", label: "hour" },
    { value: "day", label: "day" },
    { value: "litr", label: "litr" },
    { value: "kg", label: "kg" },
    { value: "g", label: "g" },
    { value: "m", label: "m" },
];

// helper na dnešní datum ve formátu YYYY-MM-DD
export const today = () => new Date().toISOString().slice(0, 10);

const invoiceItemSchema = z.object({
    name: z.string().min(1, "Item name is required"),
    description: z.string().optional(),
    quantity: z
        .coerce.number()
        .min(0.0001, "Quantity must be at least 0.0001")
        .max(999999999, "Quantity must be 999999999 or less"),
    unit: z.string().min(1, "Unit is required"),
    unitPrice: z
        .coerce.number()
        .min(0, "Unit price must be at least 0")
        .max(999999999, "Unit price must be 999999999 or less"),
    vatRate: z.coerce.number().min(0).max(100, "VAT must be between 0 and 100"),
    discount: z
        .coerce.number()
        .min(0, "Discount must be at least 0")
        .max(999999999, "Discount must be 999999999 or less")
        .optional(),
});

export const invoiceSchema = z.object({
    customerId: z.coerce.number().int().positive("Customer is required"),
    sequenceId: z.number().int().positive().nullable().optional(),
    issueDate: z.string().min(1, "Issue date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    supplyDate: z.string().min(1, "Supply date is required"),
    currency: z.string().min(1, "Currency is required"),
    taxMode: z.coerce.number().int(),
    vatRateDefault: z.coerce.number(),
    variableSymbol: z.string().optional(),
    notePublic: z.string().optional(),
    noteInternal: z.string().optional(),
    items: z.array(invoiceItemSchema).nonempty("At least one invoice item is required"),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export const defaultInvoiceItem = {
    name: "",
    description: "",
    quantity: 1,
    unit: "ks",
    unitPrice: 0,
    vatRate: 21,
    discount: 0,
};

export const getDefaultInvoiceValues = (preferredCurrency: string): InvoiceFormValues => ({
    customerId: 0,
    sequenceId: null,
    issueDate: today(),
    dueDate: today(),
    supplyDate: today(),
    currency: preferredCurrency,
    taxMode: 0,
    vatRateDefault: 21,
    variableSymbol: "",
    notePublic: "",
    noteInternal: "",
    items: [defaultInvoiceItem],
});

