export type Provider = { id: "credentials" | string; name?: string };

export type SignInResult = { error?: string };

export type ApiErrorShape = {
    data?: unknown;
    message?: string;
};

export const getErrorMessage = (error: unknown, fallback: string) => {
    const anyErr = error as ApiErrorShape;
    const data = anyErr?.data as { message?: string; error?: string } | undefined;
    return String(data?.message ?? data?.error ?? anyErr?.message ?? fallback);
};

export const parseCredentials = (formData?: FormData) => {
    const email = (formData?.get("email") as string) ?? "";
    const password = (formData?.get("password") as string) ?? "";
    const rememberMe = (formData?.get("remember") as string) === "true";
    return { email, password, rememberMe };
};

