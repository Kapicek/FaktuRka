import React from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Autocomplete, Box, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import type { InvoiceStatus } from "../../../features/invoices/invoicesApi";
import { STATUS_FILTER_OPTIONS, getStatusColor } from "./utils";

type Props = {
    selectedStatus: InvoiceStatus;
    onStatusChange: (next: InvoiceStatus) => void;
    currencyFormatter: Intl.NumberFormat;
    data: {
        statusAmounts: number[];
        statusCount: number;
    };
};

export const StatusSparklineCard = ({
    selectedStatus,
    onStatusChange,
    currencyFormatter,
    data: { statusAmounts, statusCount },
}: Props) => {
    const theme = useTheme();
    const selectedStatusOption = STATUS_FILTER_OPTIONS.find((opt) => opt.value === selectedStatus);
    const statusColor = getStatusColor(theme, selectedStatusOption?.chip.color ?? "primary");
    const gradientId = React.useMemo(
        () => `status-area-gradient-${selectedStatus}-${theme.palette.mode}`,
        [selectedStatus, theme.palette.mode],
    );

    const statusSparklineData =
        statusAmounts.length >= 2 ? statusAmounts : [statusAmounts[0] ?? 0, statusAmounts[0] ?? 0];

    return (
        <Card sx={{ height: "100%" }} variant="outlined">
            <CardContent>
                <Stack>
                    <Stack direction="row" spacing={2} justifyContent="space-between">
                        <Typography variant="body1">Status:</Typography>
                        <Autocomplete<typeof STATUS_FILTER_OPTIONS[number], false, true, false>
                            size="small"
                            options={STATUS_FILTER_OPTIONS}
                            disableClearable
                            value={selectedStatusOption ?? undefined}
                            onChange={(_, newValue) => {
                                if (newValue) onStatusChange(newValue.value);
                            }}
                            getOptionLabel={(option) => option.label}
                            renderInput={(params) => <TextField {...params} placeholder="Status" size="small" />}
                            renderOption={(props, option) => {
                                const Icon = option.chip.icon;
                                const optionColor = getStatusColor(theme, option.chip.color);
                                return (
                                    <li {...props} key={option.value}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Icon fontSize="small" sx={{ color: optionColor }} />
                                            <Typography variant="body2">{option.label}</Typography>
                                        </Stack>
                                    </li>
                                );
                            }}
                            sx={{ minWidth: 140 }}
                        />
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                        <Stack>
                            <Typography variant="body2" color="text.secondary">
                                Total amount
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={700}>
                                {currencyFormatter.format(statusAmounts.reduce((sum, v) => sum + v, 0))}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {statusCount} {statusCount === 1 ? "invoice" : "invoices"}
                            </Typography>
                        </Stack>
                        <Box sx={{ flex: 1, width: "100%", height: 80 }}>
                            <SparkLineChart
                                data={statusSparklineData}
                                height={80}
                                showTooltip
                                showHighlight
                                area
                                baseline="min"
                                color={statusColor}
                                curve="linear"
                                margin={{ top: 10, bottom: 0, left: 6, right: 0 }}
                                slotProps={{
                                    area: {
                                        style: {
                                            fill: `url(#${gradientId})`,
                                        },
                                    },
                                    line: { style: { stroke: statusColor, strokeWidth: 3 } },
                                }}
                                valueFormatter={(value) =>
                                    typeof value === "number" ? currencyFormatter.format(value) : ""
                                }
                            />
                            <svg width="0" height="0">
                                <defs>
                                    <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor={alpha(statusColor, 0.4)} />
                                        <stop offset="100%" stopColor={alpha(statusColor, 0)} />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </Box>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};
