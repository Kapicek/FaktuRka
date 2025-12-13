
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../app/store";

export const API_BASE_URL = "http://localhost:7010/api";

const rawBaseQuery = fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth?.token;
        if (token) headers.set("authorization", `Bearer ${token}`);
        return headers;
    },
});

const baseQueryWithAuth: typeof rawBaseQuery = async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);
    if (result.error && result.error.status === 401) {
        api.dispatch({ type: "auth/logout" });
    }
    return result;
};

export const baseApi = createApi({
    reducerPath: "api",
    baseQuery: baseQueryWithAuth,
    tagTypes: ["Customer", "Invoice", "Profile"],
    endpoints: () => ({}),
});
