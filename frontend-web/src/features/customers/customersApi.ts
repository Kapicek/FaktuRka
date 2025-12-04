import { baseApi } from "../api/baseApi";

// ===== Types =====

export interface CustomersListQuery extends Record<string, any> {
    search?: string;
}

export type CustomerBaseAttributes = {
    name: string;
    ico?: string;
    dic?: string;
    legalForm?: string;
    email?: string;
    phone?: string;
    note?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    zip?: string;
    countryCode?: string;
};

export type CustomerCreateAttributes = CustomerBaseAttributes;
export type CustomerUpdateAttributes = CustomerBaseAttributes;

export type Customer = CustomerBaseAttributes & {
    id: number;
};

// ===== ARES types =====
export type AresSearchItem = {
    companyId: string;
    businessName: string;
    fullAddress: string;
    legalForm: string;
};

export type AresDetail = {
    ico: string;
    obchodniJmeno: string;
    pravniForma?: string;
    dic?: string;
    sidlo?: {
        nazevUlice?: string;
        cisloDomovni?: number;
        cisloOrientacni?: number;
        cisloOrientacniPismeno?: string;
        psc?: number;
        pscTxt?: string;
        nazevObce?: string;
        textovaAdresa?: string;
    };
    [key: string]: any;
};

export const customersApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        // ===== List customers =====
        listCustomers: build.query<Customer[], CustomersListQuery | void>({
            query: (arg) => {
                const params: CustomersListQuery | undefined =
                    arg ? (arg as CustomersListQuery) : undefined;

                return {
                    url: "/Customers",
                    method: "GET",
                    params,
                };
            },
            providesTags: (result) =>
                result
                    ? [
                        ...result.map((c) => ({
                            type: "Customer" as const,
                            id: c.id,
                        })),
                        { type: "Customer" as const, id: "LIST" },
                    ]
                    : [{ type: "Customer" as const, id: "LIST" }],
        }),

        // ===== Get customer detail =====
        getCustomer: build.query<Customer, number | string>({
            query: (id) => ({
                url: `/Customers/${id}`,
                method: "GET",
            }),
            providesTags: (_res, _err, id) => [
                { type: "Customer" as const, id },
            ],
        }),

        // ===== Create customer =====
        createCustomer: build.mutation<Customer, CustomerCreateAttributes>({
            query: (attrs) => ({
                url: "/Customers",
                method: "POST",
                body: attrs,
            }),
            invalidatesTags: [{ type: "Customer", id: "LIST" }],
        }),

        // ===== Update customer =====
        updateCustomer: build.mutation<
            Customer,
            { id: number | string; data: CustomerUpdateAttributes }
        >({
            query: ({ id, data }) => ({
                url: `/Customers/${id}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (_res, _err, arg) => [
                { type: "Customer" as const, id: arg.id },
                { type: "Customer" as const, id: "LIST" },
            ],
        }),

        // ===== Delete customer =====
        deleteCustomer: build.mutation<void, number | string>({
            query: (id) => ({
                url: `/Customers/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (_res, _err, id) => [
                { type: "Customer" as const, id },
                { type: "Customer" as const, id: "LIST" },
            ],
        }),
        // ===== ARES search =====
        searchAres: build.query<
            AresSearchItem[],
            { query: string; limit?: number }
        >({
            query: ({ query, limit = 10 }) => ({
                url: "/Ares/search",
                method: "GET",
                params: { query, limit },
            }),
        }),

        // ===== ARES detail by ICO =====
        getAresByIco: build.query<AresDetail, string>({
            query: (ico) => ({
                url: `/Ares/${ico}`,
                method: "GET",
            }),
        }),
    }),
    overrideExisting: false,
});


export const {
    useListCustomersQuery,
    useGetCustomerQuery,
    useCreateCustomerMutation,
    useUpdateCustomerMutation,
    useDeleteCustomerMutation,
    useSearchAresQuery,
    useGetAresByIcoQuery,
    useLazyGetAresByIcoQuery,
} = customersApi;
