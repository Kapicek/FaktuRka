import Box from "@mui/material/Box";
import { Chip, Stack, type ChipProps, Tooltip, Autocomplete, Grid, TextField, Button } from "@mui/material";
import {
    DataGrid,
    GridActionsCellItem,
    type GridColDef,
    type GridSortModel,
    type GridRowSelectionModel,
    type GridRowId,
} from "@mui/x-data-grid";
import JSZip from "jszip";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import SendIcon from "@mui/icons-material/Send";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";

import {
    useListInvoicesQuery,
    useDeleteInvoiceMutation,
    useExportInvoiceMutation,
    type InvoiceListItem,
} from "../../features/invoices/invoicesApi";
import React from "react";
import { Delete, FileDownloadRounded, ContentCopy } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import ConfirmDialog from "../dialogs/ConfirmDialog";
import type { Customer } from "../../features/customers/customersApi";
import { useListCustomersQuery } from "../../features/customers/customersApi";
import type { ListInvoicesArgs } from "../../features/invoices/invoicesApi";
import { useSelector } from "react-redux";
import { selectToken } from "../../features/auth/authSlice";
import { API_BASE_URL } from "../../features/api/baseApi";

export enum InvoiceStatus {
    Draft = 0,
    Issued = 1,
    Sent = 2,
    Overdue = 3,
    Paid = 4,
    Cancelled = 5,
}

type StatusConfig = {
    label: string;
    color: ChipProps["color"];
    icon: React.ReactElement;
};

const STATUS_CONFIG: Record<InvoiceStatus, StatusConfig> = {
    [InvoiceStatus.Draft]: {
        label: "Draft",
        color: "default",
        icon: <DescriptionOutlinedIcon />,
    },
    [InvoiceStatus.Issued]: {
        label: "Issued",
        color: "info",
        icon: <HourglassEmptyIcon />,
    },
    [InvoiceStatus.Sent]: {
        label: "Sent",
        color: "primary",
        icon: <SendIcon />,
    },
    [InvoiceStatus.Overdue]: {
        label: "Overdue",
        color: "warning",
        icon: <WarningAmberIcon />,
    },
    [InvoiceStatus.Paid]: {
        label: "Paid",
        color: "success",
        icon: <CheckCircleOutlineIcon />,
    },
    [InvoiceStatus.Cancelled]: {
        label: "Cancelled",
        color: "error",
        icon: <CancelOutlinedIcon />,
    },
};

export default function InvoicesDatagrid() {
    const [filters, setFilters] = React.useState<{ status?: InvoiceStatus; customerId?: number }>({});
    const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 25 });
    const [sortModel, setSortModel] = React.useState<GridSortModel>([]);

    const queryArgs: ListInvoicesArgs = {
        status: filters.status,
        customerId: filters.customerId,
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        sortBy: sortModel[0]?.field,
        desc: sortModel[0]?.sort === "desc",
    };

    const { isLoading, data } = useListInvoicesQuery(queryArgs);
    const [deleteInvoice] = useDeleteInvoiceMutation();
    const [exportInvoice] = useExportInvoiceMutation();
    const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceListItem | null>(null);
    const navigate = useNavigate();
    const invoices = data?.items ?? [];
    const rowCount = data?.totalCount ?? 0;
    const authToken = useSelector(selectToken);

    const { data: customers = [], isLoading: customersLoading } = useListCustomersQuery();
    const [rowSelectionModel, setRowSelectionModel] = React.useState<GridRowSelectionModel>({
        type: "include",
        ids: new Set<GridRowId>(),
    });
    const [selectedRows, setSelectedRows] = React.useState<InvoiceListItem[]>([]);
    const [isExportingSelected, setIsExportingSelected] = React.useState(false);

    const handleDeleteClick = React.useCallback((invoice: InvoiceListItem) => {
        setSelectedInvoice(invoice);
    }, []);

    const handleCloseDialog = () => setSelectedInvoice(null);

    const handleConfirmDelete = async () => {
        if (!selectedInvoice) return;
        try {
            await deleteInvoice(selectedInvoice.id).unwrap();
        } catch (error) {
            console.error("Failed to delete invoice", error);
        } finally {
            setSelectedInvoice(null);
        }
    };

    const handleDuplicateClick = React.useCallback((invoice: InvoiceListItem) => {
        navigate("/invoices/new", { state: { duplicateInvoiceId: invoice.id } });
    }, [navigate]);

    const fetchInvoiceBlob = React.useCallback(
        async (invoiceId: number) => {
            const response = await fetch(
                `${API_BASE_URL}/Invoices/${invoiceId}/export-file`,
                {
                    headers: authToken
                        ? { Authorization: `Bearer ${authToken}` }
                        : undefined,
                }
            );
            if (!response.ok) {
                throw new Error("Failed to download invoice file");
            }
            return response.blob();
        },
        [authToken]
    );

    const handleExportClick = React.useCallback(
        async (invoice: InvoiceListItem) => {
            try {
                await exportInvoice(invoice.id).unwrap();
                const blob = await fetchInvoiceBlob(invoice.id);
                const url = window.URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = `${invoice.numberFull ?? `invoice-${invoice.id}`}.pdf`;
                document.body.appendChild(anchor);
                anchor.click();
                document.body.removeChild(anchor);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error("Failed to export invoice", error);
            }
        },
        [exportInvoice, fetchInvoiceBlob]
    );

    const handleExportSelected = React.useCallback(async () => {
        if (!selectedRows.length) return;
        setIsExportingSelected(true);
        try {
            const zip = new JSZip();
            for (const invoice of selectedRows) {
                await exportInvoice(invoice.id).unwrap();
                const blob = await fetchInvoiceBlob(invoice.id);
                const filename = `${invoice.numberFull ?? `invoice-${invoice.id}`}.pdf`;
                zip.file(filename, blob);
            }
            const content = await zip.generateAsync({ type: "blob" });
            const url = window.URL.createObjectURL(content);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `invoices-${Date.now()}.zip`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export selected invoices", error);
        } finally {
            setIsExportingSelected(false);
        }
    }, [selectedRows, exportInvoice, fetchInvoiceBlob]);

    const columns = React.useMemo<GridColDef[]>(() => [
        {
            field: "numberFull",
            headerName: "Invoice Number",
            width: 120,
            renderCell: (params) => (
                <Link style={{ textDecoration: "underline" }} to={`/invoices/${params.row.id}`}>{params.value}</Link>
            )
        },
        {
            field: "status",
            headerName: "Status",
            width: 160,
            renderCell: (params) => {
                const raw = params.value ?? InvoiceStatus.Draft;
                const cfg =
                    STATUS_CONFIG[raw as InvoiceStatus] ?? STATUS_CONFIG[InvoiceStatus.Draft];

                return (
                    <Chip
                        sx={{ px: 1 }}
                        size="small"
                        variant="outlined"
                        label={cfg.label}
                        color={cfg.color}
                        icon={cfg.icon}
                    />
                );
            },
        },
        {
            field: "issueDate",
            headerName: "Issue Date",
            width: 130,
        },
        {
            field: "dueDate",
            headerName: "Due Date",
            width: 130,
        },
        {
            field: "customerName",
            headerName: "Customer Name",
            width: 150,
        },
        {
            field: "total",
            headerName: "Total Amount",
            width: 120,
        },
        {
            field: "currency",
            headerName: "Currency",
            width: 100,
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 100,
            cellClassName: 'actions',
            renderCell: (params) => (
                <Stack direction="row" spacing={0}>
                    <Tooltip title="Duplicate">
                        <GridActionsCellItem
                            icon={<ContentCopy />}
                            label="Duplicate"
                            onClick={() => handleDuplicateClick(params.row as InvoiceListItem)}
                            color="default"
                        />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <GridActionsCellItem
                            icon={<Delete />}
                            label="Delete"
                            onClick={() => handleDeleteClick(params.row as InvoiceListItem)}
                            color="default"
                        />
                    </Tooltip>
                </Stack>
            ),
        },
    ], [handleDeleteClick, handleDuplicateClick]);

    return (
        <Box
            sx={{
                flexGrow: 1,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
            }}
        >
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
                            <Autocomplete<
                                { value: InvoiceStatus; label: string },
                                false,
                                false,
                                false
                            >
                                options={Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
                                    value: Number(key) as InvoiceStatus,
                                    label: cfg.label,
                                }))}
                                loading={false}
                                value={
                                    filters.status !== undefined
                                        ? {
                                            value: filters.status,
                                            label: STATUS_CONFIG[filters.status].label,
                                        }
                                        : null
                                }
                                onChange={(_, newValue) => {
                                    setFilters((prev) => ({
                                        ...prev,
                                        status: newValue?.value,
                                    }));
                                    setPaginationModel((prev) => ({ ...prev, page: 0 }));
                                }}
                                getOptionLabel={(option) => option.label}
                                isOptionEqualToValue={(option, value) =>
                                    option.value === value.value
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Status"
                                        size="small"
                                        sx={{ backgroundColor: "background.default" }}
                                    />
                                )}
                                renderOption={(props, option) => {
                                    const cfg = STATUS_CONFIG[option.value];
                                    return (
                                        <li {...props} key={option.value}>
                                            <Chip
                                                sx={{ px: 1 }}
                                                size="small"
                                                variant="outlined"
                                                label={cfg.label}
                                                color={cfg.color}
                                                icon={cfg.icon}
                                            />
                                        </li>
                                    );
                                }}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => {
                                        const cfg = STATUS_CONFIG[option.value];
                                        return (
                                            <Chip
                                                {...getTagProps({ index })}
                                                key={option.value}
                                                size="small"
                                                variant="outlined"
                                                label={cfg.label}
                                                color={cfg.color}
                                                icon={cfg.icon}
                                            />
                                        );
                                    })
                                }
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
                                onChange={(_, newValue) => {
                                    setFilters((prev) => ({
                                        ...prev,
                                        customerId: newValue?.id,
                                    }));
                                    setPaginationModel((prev) => ({ ...prev, page: 0 }));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Customer"
                                        size="small"
                                        sx={{ backgroundColor: "background.default" }}
                                    />
                                )}
                                clearOnEscape
                            />
                        </Stack>
                    </Grid>
                </Grid>
                <Button
                    variant="outlined"
                    startIcon={<FileDownloadRounded />}
                    disabled={!selectedRows.length || isExportingSelected}
                    sx={{ textTransform: "none", backgroundColor: "background.default" }}
                    onClick={handleExportSelected}
                >
                    {isExportingSelected ? "Exporting..." : "Export selected"}
                </Button>
            </Stack>
            <DataGrid
                rows={invoices}
                loading={isLoading}
                columns={columns}
                sortingMode="server"
                sortModel={sortModel}
                onSortModelChange={(model) => setSortModel(model)}
                paginationMode="server"
                rowCount={rowCount}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 25, 50]}
                checkboxSelection
                disableRowSelectionOnClick
                rowSelectionModel={rowSelectionModel}
                onRowSelectionModelChange={(model) => {
                    const normalizedModel: GridRowSelectionModel = Array.isArray(model)
                        ? {
                            type: "include",
                            ids: new Set<GridRowId>(model as GridRowId[]),
                        }
                        : model;
                    setRowSelectionModel(normalizedModel);

                    const idsSet =
                        normalizedModel.type === "include"
                            ? normalizedModel.ids ?? new Set<GridRowId>()
                            : new Set<GridRowId>(
                                invoices
                                    .map((row) => row.id as GridRowId)
                                    .filter(
                                        (id) =>
                                            !(normalizedModel.ids ?? new Set<GridRowId>()).has(id)
                                    )
                            );

                    const selectedIds = new Set(
                        Array.from(idsSet).map((id) => String(id))
                    );

                    const selected = invoices.filter((inv) =>
                        selectedIds.has(String(inv.id))
                    );
                    setSelectedRows(selected);
                }}
                sx={{ flex: 1 }}
            />
            <ConfirmDialog
                open={Boolean(selectedInvoice)}
                title="Delete invoice"
                message={
                    selectedInvoice
                        ? `Are you sure you want to delete invoice ${selectedInvoice.numberFull ?? `#${selectedInvoice.id}`}?`
                        : ""
                }
                okLabel="Delete"
                onClose={handleCloseDialog}
                onConfirm={handleConfirmDelete}
            />
        </Box>
    );
}
