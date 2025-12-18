import React from "react";
import { Grid } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useListInvoicesQuery, InvoiceStatus } from "../../features/invoices/invoicesApi";
import { useSelector } from "react-redux";
import { selectPreferredCurrency } from "../../features/settings/settingsSlice";
import { STATUS_CONFIG } from "./statusConfig";
import { convertAmount, getStatusColor } from "./dashboard/utils";
import { IssuedPaidChartCard } from "./dashboard/IssuedPaidChartCard";
import { StatusSparklineCard } from "./dashboard/StatusSparklineCard";
import { TotalSummaryCard } from "./dashboard/TotalSummaryCard";
import { STATUS_FILTER_OPTIONS } from "./dashboard/utils";


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
                <TotalSummaryCard
                    totalAmount={totalAmount}
                    totalCount={totalCount}
                    formatter={currencyFormatter}
                    pieData={statusPieData}
                />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
                <IssuedPaidChartCard data={issuedVsPaidChartData} />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
                <StatusSparklineCard
                    selectedStatus={selectedStatus}
                    onStatusChange={setSelectedStatus}
                    currencyFormatter={currencyFormatter}
                    data={{
                        statusAmounts,
                        statusCount,
                    }}
                />
            </Grid>
        </Grid>
    );
};

export default InvoicesDashboardCharts;
