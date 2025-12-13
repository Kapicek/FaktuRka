export type CurrencyOption = {
    code: string;
    label: string;
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
    { code: "CZK", label: "Czech koruna (CZK)" },
    { code: "EUR", label: "Euro (EUR)" },
    { code: "USD", label: "US Dollar (USD)" },
    { code: "GBP", label: "British Pound (GBP)" },
    { code: "PLN", label: "Polish Zloty (PLN)" },
];

export const CURRENCY_RATES: Record<string, number> = {
    CZK: 1,
    EUR: 25,
    USD: 23,
    GBP: 29,
    PLN: 5.5,
};
