import { baseApi } from "../api/baseApi";

// ===== Types =====

// řádek v seznamu faktur (GET /api/Invoices)
export type InvoiceListItem = {
    id: number;
    numberFull: string;
    status: number;
    issueDate: string;     // ISO date string
    dueDate: string;       // ISO date string
    customerName: string;
    total: number;
    currency: string;
};

// položka faktury v detailu
export type InvoiceItem = {
    id: number;
    orderNo: number;
    name: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatRate: number;
    discount: number;
    lineSubtotal: number;
    lineVat: number;
    lineTotal: number;
};

// detail faktury (GET /api/Invoices/{id})
export type Invoice = {
    id: number;
    numberFull: string;
    variableSymbol: string;
    status: number;
    issueDate: string;
    dueDate: string;
    supplyDate: string;
    currency: string;
    taxMode: number;
    vatRateDefault: number;

    billingName: string;
    billingAddress1: string;
    billingCity: string;
    billingZip: string;
    billingCountry: string;
    billingIco: string;
    billingDic: string;

    issuerName: string;
    issuerIco: string;
    issuerDic: string;

    subtotal: number;
    vatAmount: number;
    total: number;

    notePublic: string;
    noteInternal: string;

    items: InvoiceItem[];
};

// ===== Create payload (POST /api/Invoices) =====

export type InvoiceItemCreate = {
    name: string;
    description?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatRate: number;
    discount?: number;
};

export type InvoiceCreateAttributes = {
    customerId: number;
    sequenceId?: number | null;
    issueDate: string;
    dueDate: string;
    supplyDate: string;
    currency: string;
    taxMode: number;
    vatRateDefault: number;
    variableSymbol?: string;
    notePublic?: string;
    noteInternal?: string;
    items: InvoiceItemCreate[];
};

export const invoicesApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        // ===== List invoices =====
        listInvoices: build.query<InvoiceListItem[], void>({
            query: () => ({
                url: "/Invoices",
                method: "GET",
            }),
            providesTags: (result) =>
                result
                    ? [
                        ...result.map((inv) => ({
                            type: "Invoice" as const,
                            id: inv.id,
                        })),
                        { type: "Invoice" as const, id: "LIST" },
                    ]
                    : [{ type: "Invoice" as const, id: "LIST" }],
        }),

        // ===== Invoice detail =====
        getInvoice: build.query<Invoice, number | string>({
            query: (id) => ({
                url: `/Invoices/${id}`,
                method: "GET",
            }),
            providesTags: (_res, _err, id) => [
                { type: "Invoice" as const, id },
            ],
        }),

        // ===== Create invoice =====
        createInvoice: build.mutation<Invoice, InvoiceCreateAttributes>({
            query: (attrs) => ({
                url: "/Invoices",
                method: "POST",
                body: attrs,
            }),
            invalidatesTags: [{ type: "Invoice", id: "LIST" }],
        }),
    }),
    overrideExisting: false,
});

export const {
    useListInvoicesQuery,
    useGetInvoiceQuery,
    useCreateInvoiceMutation,
} = invoicesApi;
