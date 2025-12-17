import React from "react";
import {
    Alert,
    Autocomplete,
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
    TextField,
    Typography,
} from "@mui/material";
import type { ChipProps } from "@mui/material";
import { FileDownloadRounded, EditRounded } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
    useGetInvoiceQuery,
    useExportInvoiceMutation,
    useUpdateInvoiceMutation,
    type Invoice,
    type InvoiceUpdateAttributes,
    InvoiceStatus,
    invoicesApi,
} from "../features/invoices/invoicesApi";
import { STATUS_CONFIG } from "../components/invoices/statusConfig";
import { useTheme, type Theme } from "@mui/material/styles";
import { API_BASE_URL } from "../features/api/baseApi";
import { useDispatch, useSelector } from "react-redux";
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

type StatusOption = {
    value: InvoiceStatus;
    label: string;
    icon: React.ElementType;
    chipColor: ChipProps["color"];
};

const getStatusColor = (theme: Theme, chipColor: ChipProps["color"]) => {
    if (!chipColor || chipColor === "default") {
        return theme.palette.mode === "dark" ? theme.palette.grey[300] : theme.palette.grey[600];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paletteColor = (theme.palette as any)[chipColor]?.main;
    return paletteColor ?? theme.palette.text.primary;
};

const mapInvoiceToUpdatePayload = (
    invoice: Invoice,
    nextStatus: InvoiceStatus
): InvoiceUpdateAttributes => {
    if (!invoice.customerId) {
        throw new Error("Missing customer reference");
    }

    return {
        customerId: invoice.customerId,
        sequenceId: invoice.sequenceId ?? undefined,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        supplyDate: invoice.supplyDate ?? invoice.issueDate,
        currency: invoice.currency,
        taxMode: invoice.taxMode,
        vatRateDefault: invoice.vatRateDefault,
        variableSymbol: invoice.variableSymbol,
        notePublic: invoice.notePublic,
        noteInternal: invoice.noteInternal,
        items: invoice.items.map((item) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            discount: item.discount,
        })),
        status: nextStatus,
    };
};

const InvoicesDetail = () => {
    const navigate = useNavigate();
    const params = useParams<{ id: string }>();
    const invoiceId = params.id ?? "";
    const [tab, setTab] = React.useState(0);
    const theme = useTheme();
    const dispatch = useDispatch();
    const { data: invoice, isLoading, isError, refetch } = useGetInvoiceQuery(invoiceId, {
        skip: !invoiceId,
    });
    const authToken = useSelector(selectToken);
    const [triggerExport, { isLoading: isExporting }] = useExportInvoiceMutation();
    const [updateInvoice, { isLoading: isUpdatingStatus }] = useUpdateInvoiceMutation();
    const [statusFeedback, setStatusFeedback] = React.useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    const statusOptions = React.useMemo<StatusOption[]>(
        () =>
            Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
                value: Number(key) as InvoiceStatus,
                label: cfg.label,
                icon: cfg.icon,
                chipColor: cfg.color,
            })),
        []
    );

    const handleStatusChange = React.useCallback(
        async (nextStatus: InvoiceStatus) => {
            if (!invoice || nextStatus === invoice.status) return;
            setStatusFeedback(null);
            try {
                const payload = mapInvoiceToUpdatePayload(invoice, nextStatus);
                await updateInvoice({ id: invoice.id, body: payload }).unwrap();
                dispatch(
                    invoicesApi.util.invalidateTags([
                        { type: "Invoice", id: "LIST" },
                        { type: "Invoice", id: invoice.id },
                    ])
                );
                setStatusFeedback({ type: "success", message: "Invoice status updated." });
                await refetch();
            } catch (error) {
                const anyErr = error as { data?: any; message?: string };
                const message =
                    anyErr?.data?.message ??
                    anyErr?.data?.error ??
                    anyErr?.message ??
                    "Failed to update invoice status.";
                setStatusFeedback({ type: "error", message: String(message) });
            }
        },
        [invoice, refetch, updateInvoice]
    );

    const statusConfig = invoice ? STATUS_CONFIG[invoice.status as InvoiceStatus] : undefined;
    const StatusIcon = statusConfig?.icon;
    const selectedStatusOption = invoice
        ? statusOptions.find((opt) => opt.value === (invoice.status as InvoiceStatus)) ?? null
        : null;

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
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={1}
            >
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

                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    justifyContent={{ xs: "flex-start", sm: "flex-end" }}
                >
                    <Autocomplete<StatusOption, false, true, false>
                        options={statusOptions}
                        value={selectedStatusOption}
                        disableClearable
                        onChange={(_, next) => {
                            if (next) {
                                void handleStatusChange(next.value);
                            }
                        }}
                        size="small"
                        sx={{ minWidth: 200 }}
                        loading={isUpdatingStatus}
                        renderInput={(params) => (
                            <TextField {...params} label="Status" size="small" sx={{ backgroundColor: "background.default" }} />
                        )}
                        renderOption={(props, option) => {
                            const OptionIcon = option.icon;
                            const optionColor = getStatusColor(theme, option.chipColor);
                            return (
                                <li {...props} key={option.value}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <OptionIcon fontSize="small" sx={{ color: optionColor }} />
                                        <Typography variant="body2">{option.label}</Typography>
                                    </Stack>
                                </li>
                            );
                        }}
                        disabled={isUpdatingStatus}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<FileDownloadRounded />}
                        sx={{ textTransform: "none", backgroundColor: "background.default" }}
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

            {statusFeedback && (
                <Alert
                    severity={statusFeedback.type}
                    onClose={() => setStatusFeedback(null)}
                >
                    {statusFeedback.message}
                </Alert>
            )}

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
