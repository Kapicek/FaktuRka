import { baseApi } from "../api/baseApi";

// ====== Request payloads (attributes) ======

export type RegisterAttributes = {
    username: string;
    email: string;
    password: string;
};

export type LoginAttributes = {
    email: string;
    password: string;
};

export type PasswordResetRequestAttributes = {
    login: string;
};

export type PasswordResetConfirmAttributes = {
    code: string;
    newPassword: string;
};

export type ChangePasswordAttributes = {
    oldPassword: string;
    newPassword: string;
};

export type GoogleLoginAttributes = {
    idToken: string;
};

export type AuthResponse = {
    token: string;
    userId: string | number;
    expiresAt?: string;
    email?: string;
    fullName?: string;
};

export type ActionResult = {
    id: string;
    status: string;
    message: string;
};

export type ActionResponse = {
    results: ActionResult[];
};


export const authApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        // ===== Registration =====
        register: build.mutation<ActionResponse, RegisterAttributes>({
            query: (attrs) => ({
                url: "/auth/register",
                method: "POST",
                body: attrs,
            }),
        }),

        // ===== Klasický login =====
        login: build.mutation<AuthResponse, LoginAttributes>({
            query: (attrs) => ({
                url: "/auth/login",
                method: "POST",
                body: attrs,
            }),
        }),

        // ===== Google Login =====
        googleLogin: build.mutation<AuthResponse, GoogleLoginAttributes>({
            query: (attrs) => ({
                url: "/Auth/goole",
                method: "POST",
                body: attrs,
            }),
        }),

        // ===== Request password reset code =====
        requestPasswordReset: build.mutation<ActionResponse, PasswordResetRequestAttributes>({
            query: (attrs) => ({
                url: "/auth/request-password-reset",
                method: "POST",
                body: attrs,
            }),
        }),

        // ===== Confirm password reset =====
        resetPassword: build.mutation<ActionResponse, PasswordResetConfirmAttributes>({
            query: (attrs) => ({
                url: "/auth/reset-password",
                method: "POST",
                body: attrs,
            }),
        }),

        // ===== Change password (authenticated) =====
        changePassword: build.mutation<ActionResponse, ChangePasswordAttributes>({
            query: (attrs) => ({
                url: "/auth/change-password",
                method: "POST",
                body: attrs,
            }),
        }),
    }),
    overrideExisting: false,
});

export const {
    useRegisterMutation,
    useLoginMutation,
    useGoogleLoginMutation,
    useRequestPasswordResetMutation,
    useResetPasswordMutation,
    useChangePasswordMutation,
} = authApi;
