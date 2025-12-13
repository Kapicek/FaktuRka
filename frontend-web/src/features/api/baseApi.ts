
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../app/store";

export const API_BASE_URL = "http://localhost:7010/api";

export const baseApi = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({
        baseUrl: API_BASE_URL,
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth?.token;
            if (token) headers.set("authorization", `Bearer ${token}`);
            return headers;
        },
    }),
    tagTypes: ["Customer", "Invoice"],
    endpoints: () => ({}),
});
