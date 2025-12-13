import { baseApi } from "../api/baseApi";

// ===== Types =====

// řádek v seznamu faktur (GET /api/Invoices)
export type InvoiceListItem = {
    id: number;
    numberFull: string;
    status: number;
    issueDate: string; // ISO date string
    dueDate: string; // ISO date string
    customerName: string;
    total: number;
    currency: string;
};

// odpověď na GET /api/Invoices s paginací
export type InvoiceListResponse = {
    items: InvoiceListItem[];
    totalCount: number;
};

// query parametry dle Swaggeru
export type ListInvoicesArgs = {
    customerId?: number;
    status?: number;

    issueDateFrom?: string; // "YYYY-MM-DD"
    issueDateTo?: string;

    dueDateFrom?: string;
    dueDateTo?: string;

    number?: string;
    customerName?: string;
    currency?: string;

    totalMin?: number;
    totalMax?: number;

    sortBy?: string;
    desc?: boolean;

    page?: number;
    pageSize?: number;
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
    customerId?: number;
    sequenceId?: number | null;
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

export type InvoiceUpdateAttributes = InvoiceCreateAttributes;

export const invoicesApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        // ===== List invoices =====
        listInvoices: build.query<InvoiceListResponse, ListInvoicesArgs | void>({
            query: (args) => {
                const a = args ?? {};

                return {
                    url: "/Invoices",
                    method: "GET",
                    params: {
                        // záměrně PascalCase dle Swaggeru (bezpečné i pro .NET binder)
                        CustomerId: a.customerId,
                        Status: a.status,
                        IssueDateFrom: a.issueDateFrom,
                        IssueDateTo: a.issueDateTo,
                        DueDateFrom: a.dueDateFrom,
                        DueDateTo: a.dueDateTo,
                        Number: a.number,
                        CustomerName: a.customerName,
                        Currency: a.currency,
                        TotalMin: a.totalMin,
                        TotalMax: a.totalMax,
                        SortBy: a.sortBy,
                        Desc: a.desc,
                        Page: a.page,
                        PageSize: a.pageSize,
                    },
                };
            },
            providesTags: (result) =>
                result
                    ? [
                        ...result.items.map((inv) => ({
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
        updateInvoice: build.mutation<Invoice, { id: number | string; body: InvoiceUpdateAttributes }>({
            query: ({ id, body }) => ({
                url: `/Invoices/${id}`,
                method: "PUT",
                body,
            }),
            invalidatesTags: (_res, _err, { id }) => [
                { type: "Invoice", id },
                { type: "Invoice", id: "LIST" },
            ],
        }),
        // ===== Export invoice =====
        exportInvoice: build.mutation<void, number | string>({
            query: (id) => ({
                url: `/Invoices/${id}/export`,
                method: "POST",
            }),
        }),
        downloadInvoiceFile: build.mutation<Blob, number | string>({
            query: (id) => ({
                url: `/Invoices/${id}/export-file`,
                method: "GET",
                responseHandler: (response) => response.blob(),
            }),
        }),
        // ===== Delete invoice =====
        deleteInvoice: build.mutation<void, number | string>({
            query: (id) => ({
                url: `/Invoices/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, id) => [
                { type: "Invoice" as const, id },
                { type: "Invoice" as const, id: "LIST" },
            ],
        }),
    }),
    overrideExisting: false,
});

export const {
    useListInvoicesQuery,
    useGetInvoiceQuery,
    useCreateInvoiceMutation,
    useUpdateInvoiceMutation,
    useExportInvoiceMutation,
    useDownloadInvoiceFileMutation,
    useDeleteInvoiceMutation,
} = invoicesApi;
