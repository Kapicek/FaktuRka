import { baseApi } from "../api/baseApi";

// ====== Request payloads (attributes) ======

export type RegisterAttributes = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
};

export type RegisterResponse = {
    message: string;
    email: string;
    codeExpiresAt: string;
};

export type LoginAttributes = {
    email: string;
    password: string;
    rememberMe?: boolean;
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

export type ForgotPasswordAttributes = {
    email: string;
};

export type VerifyEmailAttributes = {
    email: string;
    code: string;
};

export type ResendVerificationAttributes = {
    email: string;
};

export type UserProfile = {
    id: number;
    email: string;
    fullName: string;
    companyName?: string | null;
    ico?: string | null;
    dic?: string | null;
    vatPayer?: boolean;
    avatarUrl?: string | null;
    roles?: string[];
};

export type AuthResponse = {
    token: string;
    userId: string | number;
    expiresAt?: string;
    profile?: UserProfile;
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
        register: build.mutation<RegisterResponse, RegisterAttributes>({
            query: (attrs) => ({
                url: "/Auth/register",
                method: "POST",
                body: attrs,
            }),
        }),

        // ===== Email verification =====
        verifyEmail: build.mutation<AuthResponse, VerifyEmailAttributes>({
            query: (attrs) => ({
                url: "/Auth/verify-email",
                method: "POST",
                body: attrs,
            }),
        }),

        resendVerification: build.mutation<{ message?: string }, ResendVerificationAttributes>({
            query: (attrs) => ({
                url: "/Auth/resend-verification",
                method: "POST",
                body: attrs,
            }),
        }),

        // ===== Klasický login =====
        login: build.mutation<AuthResponse, LoginAttributes>({
            query: ({ email, password }) => ({
                url: "/Auth/login",
                method: "POST",
                body: { email, password },
            }),
        }),

        // ===== Google Login =====
        googleLogin: build.mutation<AuthResponse, GoogleLoginAttributes>({
            query: (attrs) => ({
                url: "/Auth/google",
                method: "POST",
                body: attrs,
            }),
        }),

        // ===== Forgot password =====
        forgotPassword: build.mutation<ActionResponse, ForgotPasswordAttributes>({
            query: (attrs) => ({
                url: "/Auth/forgot-password",
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
    useVerifyEmailMutation,
    useResendVerificationMutation,
    useLoginMutation,
    useGoogleLoginMutation,
    useForgotPasswordMutation,
    useRequestPasswordResetMutation,
    useResetPasswordMutation,
    useChangePasswordMutation,
} = authApi;
