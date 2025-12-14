import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";

const getStoredCurrency = () => {
    if (typeof localStorage === "undefined") return "CZK";
    return localStorage.getItem("settings_currency") ?? "CZK";
};

type SettingsState = {
    currency: string;
};

const initialState: SettingsState = {
    currency: getStoredCurrency(),
};

const settingsSlice = createSlice({
    name: "settings",
    initialState,
    reducers: {
        setCurrency: (state, action: PayloadAction<string>) => {
            state.currency = action.payload;
            if (typeof localStorage !== "undefined") {
                localStorage.setItem("settings_currency", action.payload);
            }
        },
    },
});

export const { setCurrency } = settingsSlice.actions;
export const selectPreferredCurrency = (state: RootState) => state.settings.currency;

export default settingsSlice.reducer;
