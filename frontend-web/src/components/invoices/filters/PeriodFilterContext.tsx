import React from "react";
import type { PeriodType } from "../filterTypes";

export type PeriodFilterContextValue = {
    periodType: PeriodType;
    onChange: (type: PeriodType) => void;
};

export const PeriodFilterContext = React.createContext<PeriodFilterContextValue | null>(null);

