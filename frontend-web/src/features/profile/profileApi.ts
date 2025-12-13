import { baseApi } from "../api/baseApi";
import type { UserProfile } from "../auth/authApi";

export type UpdateProfileAttributes = {
    email?: string;
    fullName?: string;
    companyName?: string | null;
    ico?: string | null;
    dic?: string | null;
    vatPayer?: boolean;
    avatarUrl?: string | null;
};

export const profileApi = baseApi.injectEndpoints({
    endpoints: (build) => ({
        getMyProfile: build.query<UserProfile, void>({
            query: () => ({
                url: "/Profile/me",
                method: "GET",
                responseHandler: "json",
            }),
            providesTags: [{ type: "Profile", id: "ME" }],
        }),
        updateProfile: build.mutation<UserProfile, UpdateProfileAttributes>({
            query: (body) => ({
                url: "/Profile",
                method: "PUT",
                body,
                responseHandler: "json",
            }),
            invalidatesTags: [{ type: "Profile", id: "ME" }],
        }),
    }),
});

export const { useGetMyProfileQuery, useUpdateProfileMutation } = profileApi;
