import React from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    Paper,
    Stack,
    Tab,
    Tabs,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { FileDownloadRounded, EditRounded } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { useGetInvoiceQuery, useExportInvoiceMutation, type Invoice } from "../features/invoices/invoicesApi";
import { InvoiceStatus, STATUS_CONFIG } from "../components/invoices/statusConfig";
import { useTheme } from "@mui/material/styles";
import { API_BASE_URL } from "../features/api/baseApi";
import { useSelector } from "react-redux";
import { selectToken } from "../features/auth/authSlice";

const formatCurrency = (value?: number, currency = "CZK") => {
    if (typeof value !== "number") return "-";
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(value);
};

const formatDate = (value?: string) => {
    if (!value) return "-";
    return dayjs(value).format("DD.MM.YYYY");
};

const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
};

const fetchInvoiceBlob = async (invoiceId: number, token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/Invoices/${invoiceId}/export-file`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) {
        throw new Error("Failed to download invoice file");
    }
    return response.blob();
};

type TabPanelProps = {
    index: number;
    value: number;
    children: React.ReactNode;
};

const TabPanel = ({ index, value, children }: TabPanelProps) => (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 2 }}>
        {value === index && children}
    </Box>
);

const SummaryStat = ({ label, value }: { label: string; value: React.ReactNode; helper?: React.ReactNode }) => (
    <Stack spacing={0.5} sx={{ minWidth: 140 }}>
        <Typography variant="body2" color="text.secondary">
            {label}
        </Typography>
        <Typography sx={{ fontWeight: 600 }} variant="body1">{value}</Typography>
    </Stack>
);

const InvoicePreview = ({ invoice }: { invoice: Invoice }) => {
    const theme = useTheme();
    if (!invoice) return null;

    return (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, minHeight: "100%" }}>
            <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="caption" color="primary" fontWeight={700} letterSpacing={2}>
                            INVOICE
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                            #{invoice.numberFull}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            px: 2,
                            py: 0.5,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            Variable symbol
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={600}>
                            {invoice.variableSymbol || "-"}
                        </Typography>
                    </Box>
                </Stack>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="primary" fontWeight={700} letterSpacing={1}>
                            ISSUER
                        </Typography>
                        <Typography fontWeight={600}>{invoice.issuerName}</Typography>
                        <Typography variant="body2" color="text.secondary">IČ: {invoice.issuerIco || "-"}</Typography>
                        <Typography variant="body2" color="text.secondary">DIČ: {invoice.issuerDic || "-"}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="primary" fontWeight={700} letterSpacing={1}>
                            CUSTOMER
                        </Typography>
                        <Typography fontWeight={600}>{invoice.billingName}</Typography>
                        <Typography variant="body2">{invoice.billingAddress1}</Typography>
                        <Typography variant="body2">
                            {invoice.billingZip} {invoice.billingCity}, {invoice.billingCountry}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">IČ: {invoice.billingIco || "-"}</Typography>
                    </Grid>
                </Grid>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography color="text.secondary" variant="body2">
                            Issue date: {formatDate(invoice.issueDate)}
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography color="text.secondary" variant="body2">
                            Due date: {formatDate(invoice.dueDate)}
                        </Typography>
                    </Grid>
                </Grid>

                <Stack
                    direction={"row"}
                    justifyContent={"space-between"}
                    sx={{
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        borderRadius: 2,
                        p: 2,
                    }}
                >
                    <Stack direction={"column"}>
                        <Typography variant="body2">Variable symbol</Typography>
                        <Typography variant="body1" fontWeight={700}>
                            {invoice.variableSymbol || "-"}
                        </Typography>
                    </Stack>
                    <Stack direction={"column"} alignItems={"flex-end"}>
                        <Typography variant="body2">Amount due</Typography>
                        <Typography variant="body1" fontWeight={700}>
                            {formatCurrency(invoice.total, invoice.currency)}
                        </Typography>
                    </Stack>
                </Stack>
                <Box sx={{ width: "100%" }}>
                    <Typography variant="caption" color="primary" fontWeight={700} letterSpacing={1}>
                        INVOICE ITEMS
                    </Typography>
                    <Stack direction={"row"} sx={{ overflowX: "auto", width: "100%", mt: 1 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Description</TableCell>
                                    <TableCell align="right">Quantity</TableCell>
                                    <TableCell align="right">Unit price</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {invoice.items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                                            {item.description && (
                                                <Typography variant="body2" color="text.secondary">
                                                    {item.description}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            {item.quantity} {item.unit}
                                        </TableCell>
                                        <TableCell align="right">{formatCurrency(item.unitPrice, invoice.currency)}</TableCell>
                                        <TableCell align="right">{formatCurrency(item.lineTotal, invoice.currency)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Stack>
                </Box>

                <Stack direction="row" justifyContent="flex-end">
                    <Box
                        sx={{
                            bgcolor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            borderRadius: 2,
                            px: 3,
                            py: 2,
                            minWidth: 220,
                        }}
                    >
                        <Stack direction={"column"} alignItems={"flex-end"}>
                            <Typography variant="body2">Total due</Typography>
                            <Typography variant="body1" fontWeight={700}>
                                {formatCurrency(invoice.total, invoice.currency)}
                            </Typography>
                        </Stack>
                    </Box>
                </Stack>
            </Stack>
        </Paper >
    );
};

const InvoicesDetail = () => {
    const navigate = useNavigate();
    const params = useParams<{ id: string }>();
    const invoiceId = params.id ?? "";
    const [tab, setTab] = React.useState(0);
    const { data: invoice, isLoading, isError } = useGetInvoiceQuery(invoiceId, { skip: !invoiceId });
    const authToken = useSelector(selectToken);
    const [triggerExport, { isLoading: isExporting }] = useExportInvoiceMutation();

    const statusConfig = invoice ? STATUS_CONFIG[invoice.status as InvoiceStatus] : undefined;
    const StatusIcon = statusConfig?.icon;

    if (!invoiceId) {
        return (
            <Alert severity="error">Missing invoice ID.</Alert>
        );
    }

    if (isLoading) {
        return (
            <Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
                <CircularProgress />
            </Stack>
        );
    }

    if (isError || !invoice) {
        return <Alert severity="error">Invoice could not be loaded.</Alert>;
    }

    return (
        <Stack direction="column" spacing={2} sx={{ flex: 1, height: "100%" }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant='h5' fontWeight={600}>
                        {`Invoice #${invoice.numberFull}`}
                    </Typography>
                    {statusConfig && StatusIcon && (
                        <Chip
                            icon={<StatusIcon />}
                            label={statusConfig.label}
                            color={statusConfig.color}
                            variant="outlined"
                            sx={{ px: 1 }}
                            size="small"
                        />
                    )}
                </Stack>

                <Stack direction="row" spacing={1}>
                    <Button
                        variant="outlined"
                        startIcon={<FileDownloadRounded />}
                        sx={{ textTransform: "none" }}
                        disabled={isExporting}
                        onClick={async () => {
                            if (!invoice) return;
                            try {
                                await triggerExport(invoice.id).unwrap();
                                const blob = await fetchInvoiceBlob(invoice.id, authToken);
                                downloadBlob(blob, `${invoice.numberFull ?? `invoice-${invoice.id}`}.pdf`);
                            } catch (error) {
                                console.error("Failed to export invoice", error);
                            }
                        }}
                    >
                        Export
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<EditRounded />}
                        sx={{ textTransform: "none" }}
                        onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                        disabled={invoice.status !== InvoiceStatus.Draft}
                    >
                        Edit
                    </Button>
                </Stack>
            </Stack>

            <Grid container spacing={3} sx={{ flexGrow: 1 }}>
                <Grid size={{ xs: 12, lg: 7 }} sx={{ height: { lg: "100%" } }}>
                    <Paper variant="outlined" sx={{ borderRadius: 3, minHeight: { lg: "100%" }, pb: 4 }}>
                        <Tabs
                            value={tab}
                            onChange={(_e, newValue) => setTab(newValue)}
                            variant="scrollable"
                            scrollButtons="auto"
                        >
                            <Tab label="Invoice" />
                            <Tab label="Notes" />
                        </Tabs>
                        <Divider />
                        <TabPanel value={tab} index={0}>
                            <Stack spacing={3} sx={{ px: 2.5 }}>
                                <Stack direction={"row"} spacing={3}>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <SummaryStat label="Total Amount" value={formatCurrency(invoice.total, invoice.currency)} />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <SummaryStat label="Subtotal" value={formatCurrency(invoice.subtotal, invoice.currency)} />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <SummaryStat label="VAT Amount" value={formatCurrency(invoice.vatAmount, invoice.currency)} />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <SummaryStat label="Issue Date" value={formatDate(invoice.issueDate)} />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <SummaryStat label="Due Date" value={formatDate(invoice.dueDate)} />
                                        </Grid>
                                        <Grid size={{ xs: 12, md: 4 }}>
                                            <SummaryStat label="Supply Date" value={formatDate(invoice.supplyDate)} />
                                        </Grid>
                                    </Grid>
                                </Stack>

                                <Stack spacing={0}>
                                    <Typography variant="body2" color="text.secondary">
                                        Customer
                                    </Typography>
                                    <Typography fontWeight={600}>{invoice.billingName}</Typography>
                                    <Typography variant="body2">{invoice.billingAddress1}, {invoice.billingZip} {invoice.billingCity}, {invoice.billingCountry}</Typography>
                                    <Typography variant="body2" color="text.secondary">{invoice.billingIco || "-"}</Typography>
                                    <Typography variant="body2" color="text.secondary">{invoice.billingDic || "-"}</Typography>
                                </Stack>

                                <Stack>
                                    <Typography variant="body2" color="text.secondary" sx={{ pb: 0.5 }}>
                                        Items
                                    </Typography>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Description</TableCell>
                                                <TableCell align="right">Qty</TableCell>
                                                <TableCell align="right">Unit price</TableCell>
                                                <TableCell align="right">VAT</TableCell>
                                                <TableCell align="right">Total</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {invoice.items.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                                                        {item.description && (
                                                            <Typography variant="body2" color="text.secondary">
                                                                {item.description}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {item.quantity} {item.unit}
                                                    </TableCell>
                                                    <TableCell align="right">{formatCurrency(item.unitPrice, invoice.currency)}</TableCell>
                                                    <TableCell align="right">{item.vatRate}%</TableCell>
                                                    <TableCell align="right">{formatCurrency(item.lineTotal, invoice.currency)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Stack>
                            </Stack>
                        </TabPanel>
                        <TabPanel value={tab} index={1}>
                            <Stack spacing={3} sx={{ px: 2.5 }}>
                                <Stack direction={"column"}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Public note
                                    </Typography>
                                    <Typography>
                                        {invoice.notePublic || "No public notes"}
                                    </Typography>
                                </Stack>
                                <Stack direction={"column"}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Internal note
                                    </Typography>
                                    <Typography>
                                        {invoice.noteInternal || "No internal notes"}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </TabPanel>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, lg: 5 }}>
                    <InvoicePreview invoice={invoice} />
                </Grid>
            </Grid>
        </Stack >
    );
};

export default InvoicesDetail;
