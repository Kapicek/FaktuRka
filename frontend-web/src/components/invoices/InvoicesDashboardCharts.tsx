import React from "react";
import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { useListInvoicesQuery } from "../../features/invoices/invoicesApi";
import { useSelector } from "react-redux";
import { selectPreferredCurrency } from "../../features/settings/settingsSlice";
import { CURRENCY_RATES } from "../../constants/currencies";

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

const InvoicesDashboardCharts = () => {
    const theme = useTheme();
    const preferredCurrency = useSelector(selectPreferredCurrency);

    const { data } = useListInvoicesQuery();
    const invoices = data?.items ?? [];

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

    // mapování barev podle STATUS_CONFIG (default/info/primary/warning/success/error)
    const statusPieData = [
        {
            id: "Draft",
            label: "Draft",
            value: statusCounts[InvoiceStatus.Draft],
            color: theme.palette.text.secondary, // "default"
        },
        {
            id: "Issued",
            label: "Issued",
            value: statusCounts[InvoiceStatus.Issued],
            color: theme.palette.info.main,
        },
        {
            id: "Sent",
            label: "Sent",
            value: statusCounts[InvoiceStatus.Sent],
            color: theme.palette.primary.main,
        },
        {
            id: "Overdue",
            label: "Overdue",
            value: statusCounts[InvoiceStatus.Overdue],
            color: theme.palette.warning.main,
        },
        {
            id: "Paid",
            label: "Paid",
            value: statusCounts[InvoiceStatus.Paid],
            color: theme.palette.success.main,
        },
        {
            id: "Cancelled",
            label: "Cancelled",
            value: statusCounts[InvoiceStatus.Cancelled],
            color: theme.palette.error.main,
        },
    ].filter((d) => d.value > 0); // prázdné statusy vyhodíme, ať není koláč flekatý nulami

    const issuedInvoices = invoices.filter((inv) => inv.status !== InvoiceStatus.Paid);
    const paidInvoices = invoices.filter((inv) => inv.status === InvoiceStatus.Paid);

    const issuedCount = issuedInvoices.length;
    const paidCount = paidInvoices.length;

    const issuedVsPaidChartData = [
        { label: "Issued", value: issuedCount, color: theme.palette.primary.main },
        { label: "Paid", value: paidCount, color: theme.palette.success.main },
    ];

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
                                        categoryGapRatio: 0.25,
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
                    {/* třetí panel */}
                </Card>
            </Grid>
        </Grid>
    );
};

export default InvoicesDashboardCharts;
