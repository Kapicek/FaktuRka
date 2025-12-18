import type { NavigateFunction } from "react-router-dom";
import type { Provider, SignInResult } from "./utils";
import { getErrorMessage, parseCredentials } from "./utils";
import { getGoogleIdToken } from "./google";

type LoginArgs = { email: string; password: string; rememberMe: boolean };
type GoogleLoginArgs = { idToken: string };

type MutationLike = {
    unwrap: () => Promise<unknown>;
};

type LoginMutation = (args: LoginArgs) => MutationLike;
type GoogleLoginMutation = (args: GoogleLoginArgs) => MutationLike;

type Options = {
    callbackUrl: string;
    login: LoginMutation;
    googleLogin: GoogleLoginMutation;
    navigate: NavigateFunction;
};

export const createSignInHandler =
    ({ callbackUrl, login, googleLogin, navigate }: Options) =>
        async (provider: Provider, formData?: FormData, cbUrl?: string): Promise<SignInResult> => {
            const targetUrl = cbUrl || callbackUrl || "/";

            if (provider.id === "google") {
                try {
                    const idToken = await getGoogleIdToken();
                    await googleLogin({ idToken }).unwrap();
                    navigate(targetUrl, { replace: true });
                    return {};
                } catch (e: unknown) {
                    return { error: getErrorMessage(e, "Google login failed") };
                }
            }

            if (provider.id !== "credentials") {
                return { error: "Unsupported provider" };
            }

            const { email, password, rememberMe } = parseCredentials(formData);
            if (!email || !password) return { error: "Email and password are required" };

            try {
                await login({ email, password, rememberMe }).unwrap();
                navigate(targetUrl, { replace: true });
                return {};
            } catch (e: unknown) {
                return { error: getErrorMessage(e, "Login failed") };
            }
        };

