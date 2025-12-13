import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { authApi, type UserProfile } from "./authApi";

export type JwtUser = {
    sub?: string;
    email?: string;
    roles?: string[];
};

export type AuthState = {
    token: string | null;
    user: JwtUser | null;
    profile: UserProfile | null;
};

const initialState: AuthState = {
    token: typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null,
    user: null,
    profile: typeof localStorage !== "undefined"
        ? JSON.parse(localStorage.getItem("auth_profile") ?? "null")
        : null,
};

const parseJwt = (token?: string | null): JwtUser | null => {
    if (!token) return null;
    try {
        const payload = token.split(".")[1];
        const json = JSON.parse(
            atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
        );

        if (typeof json.exp === "number" && Date.now() >= json.exp * 1000) {
            return null;
        }

        return {
            sub: json.sub,
            email: json.email,
            roles: json.roles,
        };
    } catch {
        return null;
    }
}

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (state, { payload }: PayloadAction<{ token: string }>) => {
            state.token = payload.token;
            state.user = parseJwt(payload.token);
            state.profile = null;
            localStorage.setItem("auth_token", payload.token);
            localStorage.removeItem("auth_profile");
        },
        logout: (state) => {
            state.token = null;
            state.user = null;
            state.profile = null;
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_profile");
        },
        hydrateFromStorage: (state) => {
            const token = localStorage.getItem("auth_token");
            const user = parseJwt(token);
            const profileRaw = localStorage.getItem("auth_profile");
            const profile = profileRaw ? JSON.parse(profileRaw) : null;

            state.token = user ? token : null;
            state.user = user;
            state.profile = profile;

            if (!user) {
                localStorage.removeItem("auth_token");
                localStorage.removeItem("auth_profile");
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addMatcher(authApi.endpoints.login.matchFulfilled, (state, { payload }) => {
                state.token = payload.token;
                state.user = parseJwt(payload.token);
                 state.profile = payload.profile ?? null;
                localStorage.setItem("auth_token", payload.token);
                if (payload.profile) {
                    localStorage.setItem("auth_profile", JSON.stringify(payload.profile));
                } else {
                    localStorage.removeItem("auth_profile");
                }
            })
            .addMatcher(authApi.endpoints.googleLogin.matchFulfilled, (state, { payload }) => {
                state.token = payload.token;
                state.user = parseJwt(payload.token);
                 state.profile = payload.profile ?? null;
                localStorage.setItem("auth_token", payload.token);
                if (payload.profile) {
                    localStorage.setItem("auth_profile", JSON.stringify(payload.profile));
                } else {
                    localStorage.removeItem("auth_profile");
                }
            });
    },
});

export const { setCredentials, logout, hydrateFromStorage } = authSlice.actions;

// ===== Selectors =====
export const selectAuth = (state: RootState) => state.auth;
export const selectToken = (state: RootState) => state.auth.token;
export const selectUser = (state: RootState) => state.auth.user;
export const selectProfile = (state: RootState) => state.auth.profile;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.token;

export default authSlice.reducer;
