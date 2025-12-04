import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PieChart } from "@mui/x-charts/PieChart";
import { useListInvoicesQuery } from "../../features/invoices/invoicesApi";

// FE kopie backend enumu
export enum InvoiceStatus {
    Draft = 0,
    Issued = 1,
    Sent = 2,
    Overdue = 3,
    Paid = 4,
    Cancelled = 5,
}

const InvoicesDashboardCharts = () => {
    const theme = useTheme();

    const { data: invoices = [] } = useListInvoicesQuery();

    // ===== agregace dat =====
    const totalAmount = invoices.reduce(
        (sum, inv) => sum + (inv.total ?? 0),
        0
    );

    const totalCount = invoices.length;

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

    return (
        <Stack direction={"row"} spacing={2}>
            <Card variant="outlined" sx={{ flex: 1 }}>
                <CardContent>
                    <Stack direction={"row"} spacing={2} justifyContent={"space-between"}>
                        <Stack direction={"column"}>
                            <Typography variant="body1">Total:</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, pb: 2 }}>
                                {totalAmount.toLocaleString("cs-CZ")} CZK
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

            <Card sx={{ flex: 1 }} variant="outlined">
                {/* sem pak dáme další graf / statistiku */}
            </Card>
            <Card sx={{ flex: 1 }} variant="outlined">
                {/* třetí panel */}
            </Card>
        </Stack>
    );
};

export default InvoicesDashboardCharts;
