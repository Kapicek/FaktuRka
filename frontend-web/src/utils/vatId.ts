const VAT_ID_REGEX = /^[A-Z]{2}\d{8,10}$/;

export const VAT_ID_FORMAT_MESSAGE =
    "VAT ID must start with a country code followed by 8-10 digits (e.g. CZ12345678)";

const normalizeVatId = (value: string) => value.replace(/\s+/g, "").toUpperCase();

export const isValidVatId = (value: string) => VAT_ID_REGEX.test(normalizeVatId(value));

export const ensureVatIdFormat = (value?: string | null) => {
    if (!value) return true;
    return isValidVatId(value);
};
