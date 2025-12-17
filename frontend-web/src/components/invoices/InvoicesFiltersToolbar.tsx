import React from "react";
import {
    Autocomplete,
    Grid,
    Stack,
    TextField,
    Typography,
    Button,
    ToggleButtonGroup,
    ToggleButton,
    IconButton,
    InputAdornment,
} from "@mui/material";
import type { Customer } from "../../features/customers/customersApi";
import { STATUS_CONFIG } from "./statusConfig";
import type { InvoiceStatus } from "./statusConfig";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ClearIcon from "@mui/icons-material/Clear";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import type { InvoicesFiltersState, PeriodType } from "./filterTypes";
import type { DateView } from "@mui/x-date-pickers/models";
import { PickersCalendarHeader } from "@mui/x-date-pickers/PickersCalendarHeader";
import type { PickersCalendarHeaderProps } from "@mui/x-date-pickers/PickersCalendarHeader";

const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
    day: "Day",
    month: "Month",
    year: "Year",
};

const adjustPeriodValue = (value: dayjs.Dayjs | string, periodType: PeriodType): string | undefined => {
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

type PeriodFilterContextValue = {
    periodType: PeriodType;
    onChange: (type: PeriodType) => void;
};

const PeriodFilterContext = React.createContext<PeriodFilterContextValue | null>(null);

const CalendarHeaderWithPeriod = (props: PickersCalendarHeaderProps) => {
    const ctx = React.useContext(PeriodFilterContext);
    return (
        <Stack spacing={1} sx={{ px: 1, pt: 1 }}>
            <PickersCalendarHeader {...props} />
            {ctx && (
                <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={ctx.periodType}
                    onChange={(_event, nextValue: PeriodType | null) => {
                        if (nextValue) ctx.onChange(nextValue);
                    }}
                    sx={{
                        width: "100%",
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        pb: 1
                    }}
                >
                    {(Object.keys(PERIOD_TYPE_LABELS) as PeriodType[]).map((type) => (
                        <ToggleButton
                            key={type}
                            value={type}
                            disableRipple
                            size="small"
                            sx={{
                                borderRadius: 1,
                                borderColor: "divider",
                                px: 1,
                                "&.Mui-selected": {
                                    bgcolor: "primary.main",
                                    color: "primary.contrastText",
                                },
                            }}
                        >
                            {PERIOD_TYPE_LABELS[type]}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            )}
        </Stack>
    );
};

type Props = {
    filters: InvoicesFiltersState;
    onChange: (next: InvoicesFiltersState) => void;
    customers: Customer[];
    customersLoading: boolean;
};

const statusOptions = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    value: Number(key) as InvoiceStatus,
    label: cfg.label,
    chip: cfg,
}));

export const InvoicesFiltersToolbar = ({
    filters,
    onChange,
    customers,
    customersLoading,
}: Props) => {
    const derivedView: DateView =
        filters.periodType === "day"
            ? "day"
            : filters.periodType === "month"
                ? "month"
                : "year";

    const handlePeriodTypeChange = React.useCallback(
        (type: PeriodType) => {
            const adjustedValue = filters.periodValue
                ? adjustPeriodValue(filters.periodValue, type)
                : undefined;
            onChange({
                ...filters,
                periodType: type,
                periodValue: adjustedValue,
            });
        },
        [filters, onChange]
    );

    const handleClearPeriod = React.useCallback(() => {
        onChange({
            ...filters,
            periodValue: undefined,
        });
    }, [filters, onChange]);

    const periodInputRef = React.useRef<HTMLInputElement | null>(null);
    const [isPeriodPickerOpen, setIsPeriodPickerOpen] = React.useState(false);

    const openPeriodPicker = React.useCallback(() => {
        setIsPeriodPickerOpen(true);
        periodInputRef.current?.focus();
    }, []);

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack
                direction="row"
                spacing={2}
                mb={2}
                flexShrink={0}
                alignItems="flex-start"
            >
                <Grid container spacing={2} sx={{ flex: 1 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Stack spacing={1}>
                            <Autocomplete<typeof statusOptions[number], false, false, false>
                                options={statusOptions}
                                value={
                                    filters.status !== undefined
                                        ? statusOptions.find((opt) => opt.value === filters.status) ?? null
                                        : null
                                }
                                onChange={(_, newValue) =>
                                    onChange({
                                        ...filters,
                                        status: newValue?.value,
                                    })
                                }
                                getOptionLabel={(option) => option.label}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Status"
                                        size="small"
                                        sx={{ backgroundColor: "background.default" }}
                                    />
                                )}
                                renderOption={(props, option) => {
                                    const Icon = option.chip.icon;
                                    return (
                                        <li {...props} key={option.value}>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Icon
                                                    fontSize="small"
                                                    color={option.chip.color === "default" ? "inherit" : option.chip.color}
                                                />
                                                <Typography variant="body2">{option.label}</Typography>
                                            </Stack>
                                        </li>
                                    );
                                }}
                                clearOnEscape
                            />
                        </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Stack spacing={1}>
                            <Autocomplete<Customer, false, false, false>
                                options={customers}
                                loading={customersLoading}
                                getOptionLabel={(option) => option.name ?? `#${option.id}`}
                                value={
                                    filters.customerId
                                        ? customers.find((c) => c.id === filters.customerId) ?? null
                                        : null
                                }
                                onChange={(_, newValue) =>
                                    onChange({
                                        ...filters,
                                        customerId: newValue?.id,
                                    })
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Customer"
                                        size="small"
                                        sx={{ backgroundColor: "background.default" }}
                                    />
                                )}
                                clearOnEscape
                            />
                        </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Stack spacing={1}>
                            <PeriodFilterContext.Provider
                                value={{
                                    periodType: filters.periodType,
                                    onChange: handlePeriodTypeChange,
                                }}
                            >
                                <DatePicker
                                    label={
                                        filters.periodType === "day"
                                            ? "Issue day"
                                            : filters.periodType === "month"
                                                ? "Issue month"
                                                : "Issue year"
                                    }
                                    views={
                                        filters.periodType === "day"
                                            ? ["year", "month", "day"]
                                            : filters.periodType === "month"
                                                ? ["year", "month"]
                                                : ["year"]
                                    }
                                    value={filters.periodValue ? dayjs(filters.periodValue) : null}
                                    onChange={(value) =>
                                        onChange({
                                            ...filters,
                                            periodValue: value
                                                ? adjustPeriodValue(value, filters.periodType)
                                                : undefined,
                                        })
                                    }
                                    open={isPeriodPickerOpen}
                                    onOpen={() => setIsPeriodPickerOpen(true)}
                                    onClose={() => setIsPeriodPickerOpen(false)}
                                    view={derivedView}
                                    onViewChange={() => { }}
                                    slots={{
                                        calendarHeader: CalendarHeaderWithPeriod,
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
                                                        {filters.periodValue && (
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
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Stack spacing={1}>
                            <Button
                                variant="outlined"
                                color={filters.overdueOnly ? "primary" : "inherit"}
                                startIcon={<WarningAmberIcon fontSize="small" />}
                                onClick={() =>
                                    onChange({
                                        ...filters,
                                        overdueOnly: !filters.overdueOnly,
                                    })
                                }
                                sx={{
                                    textTransform: "none",
                                    height: 40,
                                    backgroundColor: "background.default",
                                }}
                            >
                                Overdue
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Stack>
        </LocalizationProvider>
    );
};
