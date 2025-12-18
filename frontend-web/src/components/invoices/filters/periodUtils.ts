import type { DateView } from "@mui/x-date-pickers/models";
import dayjs from "dayjs";
import type { PeriodType } from "../filterTypes";

export const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
    day: "Day",
    month: "Month",
    year: "Year",
};

export const derivePeriodView = (periodType: PeriodType): DateView =>
    periodType === "day" ? "day" : periodType === "month" ? "month" : "year";

export const getPeriodLabel = (periodType: PeriodType) =>
    periodType === "day" ? "Issue day" : periodType === "month" ? "Issue month" : "Issue year";

export const getPeriodViews = (periodType: PeriodType): DateView[] =>
    periodType === "day"
        ? ["year", "month", "day"]
        : periodType === "month"
            ? ["year", "month"]
            : ["year"];

export const adjustPeriodValue = (
    value: dayjs.Dayjs | string,
    periodType: PeriodType,
): string | undefined => {
    const date = typeof value === "string" ? dayjs(value) : value;
    if (!date.isValid()) return undefined;

    switch (periodType) {
        case "day":
            return date.startOf("day").format("YYYY-MM-DD");
        case "month":
            return date.startOf("month").format("YYYY-MM-DD");
        case "year":
            return date.startOf("year").format("YYYY-MM-DD");
        default:
            return undefined;
    }
};

