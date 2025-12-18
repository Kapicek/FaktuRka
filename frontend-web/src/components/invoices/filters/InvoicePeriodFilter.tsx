import React from "react";
import { IconButton, InputAdornment, Stack } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import type { PeriodType } from "../filterTypes";
import type { DateView } from "@mui/x-date-pickers/models";
import { PeriodFilterContext } from "./PeriodFilterContext";
import { PeriodCalendarHeaderWithPeriod } from "./PeriodCalendarHeaderWithPeriod";
import { adjustPeriodValue, derivePeriodView, getPeriodLabel, getPeriodViews } from "./periodUtils";

type Props = {
    periodType: PeriodType;
    periodValue: string | undefined;
    onChange: (next: { periodType: PeriodType; periodValue: string | undefined }) => void;
};

export const InvoicePeriodFilter = ({ periodType, periodValue, onChange }: Props) => {
    const derivedView: DateView = derivePeriodView(periodType);

    const handlePeriodTypeChange = React.useCallback(
        (nextType: PeriodType) => {
            const adjustedValue = periodValue ? adjustPeriodValue(periodValue, nextType) : undefined;
            onChange({ periodType: nextType, periodValue: adjustedValue });
        },
        [onChange, periodValue],
    );

    const handleClearPeriod = React.useCallback(() => {
        onChange({ periodType, periodValue: undefined });
    }, [onChange, periodType]);

    const periodInputRef = React.useRef<HTMLInputElement | null>(null);
    const [isPeriodPickerOpen, setIsPeriodPickerOpen] = React.useState(false);

    const openPeriodPicker = React.useCallback(() => {
        setIsPeriodPickerOpen(true);
        periodInputRef.current?.focus();
    }, []);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={1}>
                <PeriodFilterContext.Provider
                    value={{
                        periodType,
                        onChange: handlePeriodTypeChange,
                    }}
                >
                    <DatePicker
                        label={getPeriodLabel(periodType)}
                        views={getPeriodViews(periodType)}
                        value={periodValue ? dayjs(periodValue) : null}
                        onChange={(value) =>
                            onChange({
                                periodType,
                                periodValue: value ? adjustPeriodValue(value, periodType) : undefined,
                            })
                        }
                        open={isPeriodPickerOpen}
                        onOpen={() => setIsPeriodPickerOpen(true)}
                        onClose={() => setIsPeriodPickerOpen(false)}
                        view={derivedView}
                        onViewChange={() => {}}
                        slots={{
                            calendarHeader: PeriodCalendarHeaderWithPeriod,
                        }}
                        slotProps={{
                            textField: {
                                size: "small",
                                sx: {
                                    backgroundColor: "background.default",
                                },
                                inputRef: periodInputRef,
                                InputProps: {
                                    endAdornment: (
                                        <InputAdornment position="end" sx={{ gap: 0.5 }}>
                                            {periodValue && (
                                                <IconButton
                                                    size="small"
                                                    aria-label="Clear period"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        handleClearPeriod();
                                                    }}
                                                >
                                                    <ClearIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                            <IconButton
                                                size="small"
                                                aria-label="Open calendar"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    openPeriodPicker();
                                                }}
                                            >
                                                <CalendarTodayIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            },
                        }}
                    />
                </PeriodFilterContext.Provider>
            </Stack>
        </LocalizationProvider>
    );
};

