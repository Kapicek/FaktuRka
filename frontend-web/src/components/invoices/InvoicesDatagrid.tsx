import React from "react";
import Box from "@mui/material/Box";
import { Stack, Tooltip, Chip } from "@mui/material";
import {
    DataGrid,
    GridActionsCellItem,
    type GridColDef,
    type GridSortModel,
    type GridRowSelectionModel,
    type GridRowId,
} from "@mui/x-data-grid";
import { Delete, FileDownloadRounded, ContentCopy } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import JSZip from "jszip";
import { useSelector } from "react-redux";

import {
    useListInvoicesQuery,
    useDeleteInvoiceMutation,
    useExportInvoiceMutation,
    type InvoiceListItem,
} from "../../features/invoices/invoicesApi";
import { useListCustomersQuery } from "../../features/customers/customersApi";
import type { ListInvoicesArgs } from "../../features/invoices/invoicesApi";
import ConfirmDialog from "../dialogs/ConfirmDialog";
import { InvoicesFiltersToolbar } from "./InvoicesFiltersToolbar";
import { InvoiceStatus, STATUS_CONFIG } from "./statusConfig";
import { selectToken } from "../../features/auth/authSlice";
import { API_BASE_URL } from "../../features/api/baseApi";
import dayjs from "dayjs";

type FiltersState = {
    status?: InvoiceStatus;
    customerId?: number;
    periodDate?: string;
    overdueOnly?: boolean;
};

const extractSelectedIds = (
    model: GridRowSelectionModel,
    currentRowIds: GridRowId[] = []
): Set<GridRowId> => {
    if (Array.isArray(model)) {
        return new Set(model as GridRowId[]);
    }

    if (model.type === "exclude") {
        const selected = new Set<GridRowId>();
        currentRowIds.forEach((id) => {
            if (!model.ids.has(id)) {
                selected.add(id);
            }
        });
        return selected;
    }

    return new Set(model.ids ?? []);
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

type SelectionContext = {
    selectedCount: number;
    isExporting: boolean;
    exportSelected: () => void;
};

type InvoicesDatagridProps = {
    onSelectionContextChange?: (ctx: SelectionContext) => void;
};

export default function InvoicesDatagrid({ onSelectionContextChange }: InvoicesDatagridProps) {
    const navigate = useNavigate();
    const authToken = useSelector(selectToken);

    const [filters, setFilters] = React.useState<FiltersState>({});
    const [paginationModel, setPaginationModel] = React.useState({ page: 0, pageSize: 25 });
    const [sortModel, setSortModel] = React.useState<GridSortModel>([]);
    const [rowSelectionIds, setRowSelectionIds] = React.useState<Set<GridRowId>>(new Set());
    const [selectedRowsMap, setSelectedRowsMap] = React.useState<Record<string, InvoiceListItem>>({});
    const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceListItem | null>(null);
    const [isExportingSelected, setIsExportingSelected] = React.useState(false);

    const queryArgs: ListInvoicesArgs = {
        status: filters.status,
        customerId: filters.customerId,
        issueDateFrom: filters.periodDate,
        issueDateTo: filters.periodDate,
        dueDateTo: filters.overdueOnly ? dayjs().format("YYYY-MM-DD") : undefined,
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        sortBy: sortModel[0]?.field,
        desc: sortModel[0]?.sort === "desc",
    };

    const { isLoading, data } = useListInvoicesQuery(queryArgs);
    const { data: customersData, isLoading: customersLoading } = useListCustomersQuery();
    const [deleteInvoice] = useDeleteInvoiceMutation();
    const [triggerExport] = useExportInvoiceMutation();

    const invoices = data?.items ?? [];
    const customers = customersData?.items ?? [];
    const rowCount = data?.totalCount ?? 0;
    const currentPageRowIds = React.useMemo(
        () => invoices.map((inv) => inv.id as GridRowId),
        [invoices]
    );

    const selectedInvoices = React.useMemo(
        () => Object.values(selectedRowsMap),
        [selectedRowsMap]
    );

    const handleFiltersChange = React.useCallback((next: FiltersState) => {
        setFilters(next);
        setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, []);

    const handleDeleteClick = React.useCallback((invoice: InvoiceListItem) => {
        setSelectedInvoice(invoice);
    }, []);

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

    const handleDuplicateClick = React.useCallback(
        (invoice: InvoiceListItem) => {
            navigate("/invoices/new", { state: { duplicateInvoiceId: invoice.id } });
        },
        [navigate]
    );

    const handleExportSelected = React.useCallback(async () => {
        if (!selectedInvoices.length) return;
        setIsExportingSelected(true);
        try {
            const zip = new JSZip();
            for (const invoice of selectedInvoices) {
                await triggerExport(invoice.id).unwrap();
                const blob = await fetchInvoiceBlob(invoice.id, authToken);
                zip.file(`${invoice.numberFull ?? `invoice-${invoice.id}`}.pdf`, blob);
            }
            const archive = await zip.generateAsync({ type: "blob" });
            downloadBlob(archive, `invoices-${Date.now()}.zip`);
        } catch (error) {
            console.error("Failed to export selected invoices", error);
        } finally {
            setIsExportingSelected(false);
        }
    }, [selectedInvoices, triggerExport, authToken]);

    React.useEffect(() => {
        if (!onSelectionContextChange) return;
        onSelectionContextChange({
            selectedCount: selectedInvoices.length,
            isExporting: isExportingSelected,
            exportSelected: handleExportSelected,
        });
    }, [selectedInvoices.length, isExportingSelected, handleExportSelected, onSelectionContextChange]);

    const rowSelectionModel = React.useMemo<GridRowSelectionModel>(
        () => ({
            type: "include",
            ids: new Set(rowSelectionIds),
        }),
        [rowSelectionIds]
    );

    const updateSelectedRows = React.useCallback(
        (nextIds: Set<GridRowId>) => {
            setRowSelectionIds(nextIds);
            setSelectedRowsMap((prev) => {
                const next: Record<string, InvoiceListItem> = {};
                nextIds.forEach((id) => {
                    const key = String(id);
                    if (prev[key]) {
                        next[key] = prev[key];
                    }
                });
                invoices.forEach((inv) => {
                    const key = String(inv.id);
                    if (nextIds.has(inv.id as GridRowId)) {
                        next[key] = inv;
                    }
                });
                return next;
            });
        },
        [invoices]
    );

    const columns = React.useMemo<GridColDef[]>(() => [
        {
            field: "numberFull",
            headerName: "Invoice Number",
            width: 120,
            renderCell: (params) => (
                <Link style={{ textDecoration: "underline" }} to={`/invoices/${params.row.id}`}>
                    {params.value}
                </Link>
            ),
        },
        {
            field: "status",
            headerName: "Status",
            width: 160,
            renderCell: (params) => {
                const raw = params.value ?? InvoiceStatus.Draft;
                const cfg = STATUS_CONFIG[raw as InvoiceStatus];
                const Icon = cfg.icon;
                return (
                    <Chip
                        sx={{ px: 1 }}
                        size="small"
                        variant="outlined"
                        label={cfg.label}
                        color={cfg.color}
                        icon={<Icon />}
                    />
                );
            },
        },
        { field: "issueDate", headerName: "Issue Date", width: 130 },
        { field: "dueDate", headerName: "Due Date", width: 130 },
        { field: "customerName", headerName: "Customer Name", width: 150 },
        { field: "total", headerName: "Total Amount", width: 120 },
        { field: "currency", headerName: "Currency", width: 100 },
        {
            field: "actions",
            type: "actions",
            headerName: "Actions",
            width: 100,
            cellClassName: "actions",
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
            <InvoicesFiltersToolbar
                filters={filters}
                onChange={handleFiltersChange}
                customers={customers}
                customersLoading={customersLoading}
            />

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
                onRowSelectionModelChange={(model) =>
                    updateSelectedRows(extractSelectedIds(model, currentPageRowIds))
                }
                disableRowSelectionExcludeModel
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
                onClose={() => setSelectedInvoice(null)}
                onConfirm={handleConfirmDelete}
            />
        </Box>
    );
}
