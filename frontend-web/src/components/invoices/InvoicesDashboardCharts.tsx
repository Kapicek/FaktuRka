import React from "react";
import { Autocomplete, Box, Card, CardContent, Grid, Stack, TextField, Typography } from "@mui/material";
import type { ChipProps } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { useListInvoicesQuery } from "../../features/invoices/invoicesApi";
import { useSelector } from "react-redux";
import { selectPreferredCurrency } from "../../features/settings/settingsSlice";
import { CURRENCY_RATES } from "../../constants/currencies";
import { STATUS_CONFIG } from "./statusConfig";

// FE kopie backend enumu
export enum InvoiceStatus {
    Draft = 0,
    Issued = 1,
    Sent = 2,
    Overdue = 3,
    Paid = 4,
    Cancelled = 5,
}

const getCurrencyRate = (code?: string) => {
    if (!code) return 1;
    return CURRENCY_RATES[code] ?? 1;
};

const convertAmount = (value: number, fromCurrency: string | undefined, toCurrency: string) => {
    const fromRate = getCurrencyRate(fromCurrency);
    const toRate = getCurrencyRate(toCurrency);
    if (toRate === 0) return value;
    return (value * fromRate) / toRate;
};

const STATUS_FILTER_OPTIONS = Object.entries(STATUS_CONFIG).map(([key, config]) => ({
    label: config.label,
    value: Number(key) as InvoiceStatus,
    chip: config,
}));

const getStatusColor = (theme: Theme, chipColor: ChipProps["color"]) => {
    if (chipColor === "default" || !chipColor) {
        return theme.palette.mode === "dark" ? "#FFFFFF" : theme.palette.grey[600];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colorFromPalette = (theme.palette as any)[chipColor]?.main;
    return colorFromPalette ?? theme.palette.primary.main;
};


const InvoicesDashboardCharts = () => {
    const theme = useTheme();
    const preferredCurrency = useSelector(selectPreferredCurrency);

    const { data } = useListInvoicesQuery();
    const invoicesFromApi = data?.items ?? [];
    const invoices = invoicesFromApi.length ? invoicesFromApi : [];

    // ===== agregace dat =====
    const totalAmount = invoices.reduce(
        (sum, inv) => sum + convertAmount(inv.total ?? 0, inv.currency, preferredCurrency),
        0
    );
    const currencyFormatter = React.useMemo(
        () =>
            new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: preferredCurrency,
                minimumFractionDigits: 2,
            }),
        [preferredCurrency]
    );

    const totalCount = data?.totalCount ?? invoices.length;

    // count per status
    const statusCounts: Record<InvoiceStatus, number> = {
        [InvoiceStatus.Draft]: 0,
        [InvoiceStatus.Issued]: 0,
        [InvoiceStatus.Sent]: 0,
        [InvoiceStatus.Overdue]: 0,
        [InvoiceStatus.Paid]: 0,
        [InvoiceStatus.Cancelled]: 0,
    };

    for (const inv of invoices) {
        const s = inv.status as InvoiceStatus;
        if (s in statusCounts) {
            statusCounts[s] += 1;
        }
    }

    const statusPieData = Object.entries(STATUS_CONFIG)
        .map(([key, config]) => ({
            id: config.label,
            label: config.label,
            value: statusCounts[Number(key) as InvoiceStatus],
            color: getStatusColor(theme, config.color),
        }))
        .filter((d) => d.value > 0); // prázdné statusy vyhodíme, ať není koláč flekatý nulami

    const issuedInvoices = invoices.filter((inv) => inv.status !== InvoiceStatus.Paid);
    const paidInvoices = invoices.filter((inv) => inv.status === InvoiceStatus.Paid);

    const issuedCount = issuedInvoices.length;
    const paidCount = paidInvoices.length;

    const issuedVsPaidChartData = [
        { label: "Issued", value: issuedCount, color: theme.palette.primary.main },
        { label: "Paid", value: paidCount, color: theme.palette.success.main },
    ];

    const [selectedStatus, setSelectedStatus] = React.useState<InvoiceStatus>(InvoiceStatus.Draft);
    const selectedStatusOption = STATUS_FILTER_OPTIONS.find((opt) => opt.value === selectedStatus);
    const statusColor = getStatusColor(theme, selectedStatusOption?.chip.color ?? "primary");
    const gradientId = React.useMemo(
        () => `status-area-gradient-${selectedStatus}-${theme.palette.mode}`,
        [selectedStatus, theme.palette.mode]
    );

    const invoicesByStatus = invoices.filter((inv) => inv.status === selectedStatus);
    const statusAmount = invoicesByStatus.reduce(
        (sum, inv) => sum + convertAmount(inv.total ?? 0, inv.currency, preferredCurrency),
        0
    );

    const sortedStatusInvoices = [...invoicesByStatus].sort(
        (a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime()
    );

    const statusAmounts = sortedStatusInvoices.map((inv) =>
        convertAmount(inv.total ?? 0, inv.currency, preferredCurrency)
    );
    const statusSparklineData =
        statusAmounts.length >= 2
            ? statusAmounts
            : [statusAmounts[0] ?? 0, statusAmounts[0] ?? 0];
    const statusCount = invoicesByStatus.length;

    return (
        <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
                <Card variant="outlined" sx={{ height: "100%" }}>
                    <CardContent>
                        <Stack direction={"row"} spacing={2} justifyContent={"space-between"}>
                            <Stack direction={"column"}>
                                <Typography variant="body1">Total:</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, pb: 2 }}>
                                    {currencyFormatter.format(totalAmount)}
                                </Typography>
                                <Typography variant="body1">
                                    {totalCount} {totalCount === 1 ? "invoice" : "invoices"}
                                </Typography>
                            </Stack>
                            <Box sx={{ maxHeight: 150 }}>
                                <PieChart
                                    series={[
                                        {
                                            highlightScope: { fade: 'global', highlight: 'item' },
                                            data: statusPieData.length
                                                ? statusPieData
                                                : [
                                                    // fallback, když nejsou data – ať graf nezmizí úplně
                                                    { id: "Empty", value: 1, label: "No data" },
                                                ],
                                            innerRadius: 35,
                                            paddingAngle: 1,
                                            cornerRadius: 3,
                                        },
                                    ]}
                                    width={120}
                                    height={120}
                                    hideLegend
                                />
                            </Box>
                        </Stack>
                    </CardContent>
                </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ height: "100%", pt: 2 }} variant="outlined">
                    <Stack>
                        <Typography variant="body1" sx={{ px: 2 }}>
                            Issued / Paid:
                        </Typography>

                        <Box sx={{ width: "100%", height: 100, top: 0 }}>
                            <BarChart
                                borderRadius={4}
                                yAxis={[
                                    {
                                        scaleType: "band",
                                        data: issuedVsPaidChartData.map((item) => item.label),
                                        tickLabelStyle: { display: "none" },
                                        tickSize: 0,
                                        categoryGapRatio: 0.3,
                                        barGapRatio: 0,
                                        position: "none",
                                    },
                                ]}
                                xAxis={[{ min: 0 }]}
                                series={[
                                    {
                                        id: "issued-vs-paid",
                                        highlightScope: { fade: 'global', highlight: 'item' },
                                        data: issuedVsPaidChartData.map((item) => item.value),
                                        layout: "horizontal",
                                        barLabelPlacement: "outside",
                                        valueFormatter: (value) => (value ?? 0).toString(),
                                        color: theme.palette.primary.main,
                                        colorGetter: ({ dataIndex }) =>
                                            issuedVsPaidChartData[dataIndex]?.color ?? theme.palette.primary.main,
                                    },
                                ]}
                                hideLegend
                                layout="horizontal"
                                margin={{ bottom: 10, top: 5 }}

                            />
                        </Box>
                    </Stack>
                </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ height: "100%" }} variant="outlined">
                    <CardContent>
                        <Stack>
                            <Stack direction="row" spacing={2} justifyContent="space-between">
                                <Typography variant="body1">
                                    Status:
                                </Typography>
                                <Autocomplete<typeof STATUS_FILTER_OPTIONS[number], false, true, false>
                                    size="small"
                                    options={STATUS_FILTER_OPTIONS}
                                    disableClearable
                                    value={selectedStatusOption ?? undefined}
                                    onChange={(_, newValue) => {
                                        if (newValue) {
                                            setSelectedStatus(newValue.value);
                                        }
                                    }}
                                    getOptionLabel={(option) => option.label}
                                    renderInput={(params) => (
                                        <TextField {...params} placeholder="Status" size="small" />
                                    )}
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
                                        {currencyFormatter.format(statusAmount)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {statusCount} {statusCount === 1 ? "invoice" : "invoices"}
                                    </Typography>
                                </Stack>
                                <Box sx={{ flex: 1, minWidth: 200, height: 90 }}>

                                    <SparkLineChart
                                        data={statusSparklineData}
                                        height={90}
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
            </Grid>
        </Grid>
    );
};

export default InvoicesDashboardCharts;
