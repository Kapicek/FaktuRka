import { z } from "zod";
import { ensureVatIdFormat, VAT_ID_FORMAT_MESSAGE } from "../utils/vatId";

const icoRegex = /^[0-9]{8}$/;
const zipRegex = /^(\d{5}|\d{3}\s?\d{2})$/;

export const customerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    ico: z
        .string()
        .trim()
        .optional()
        .or(z.literal(""))
        .refine((val) => !val || icoRegex.test(val), "IČO must have 8 digits"),
    dic: z
        .string()
        .trim()
        .optional()
        .or(z.literal(""))
        .refine((val) => ensureVatIdFormat(val), { message: VAT_ID_FORMAT_MESSAGE }),
    legalForm: z.string().trim().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().trim().optional(),
    note: z.string().trim().optional(),

    addressLine1: z.string().trim().optional(),
    addressLine2: z.string().trim().optional(),
    city: z.string().trim().optional(),
    zip: z
        .string()
        .trim()
        .optional()
        .or(z.literal(""))
        .refine((val) => !val || zipRegex.test(val), "ZIP must be 5 digits (e.g. 12345 or 123 45)"),
    countryCode: z.string().trim().optional(),
    addressDisplay: z.string().trim().optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const customerDefaultValues: CustomerFormValues = {
    name: "",
    ico: "",
    dic: "",
    legalForm: "",
    email: "",
    phone: "",
    note: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    zip: "",
    countryCode: "CZ",
    addressDisplay: "",
};

export const formatAddressDisplay = (line1?: string | null, zip?: string | null, city?: string | null) => {
    const cityPart = [zip, city].filter(Boolean).join(" ");
    return [line1, cityPart].filter(Boolean).join(", ");
};

