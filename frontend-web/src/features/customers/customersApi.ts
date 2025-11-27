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
    }),
    overrideExisting: false,
});


export const {
    useListCustomersQuery,
    useGetCustomerQuery,
    useCreateCustomerMutation,
    useUpdateCustomerMutation,
    useDeleteCustomerMutation,
} = customersApi;
