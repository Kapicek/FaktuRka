import Box from "@mui/material/Box";
import { Chip, Stack, type ChipProps, Tooltip } from "@mui/material";
import {
    DataGrid,
    GridActionsCellItem,
    type GridColDef,
} from "@mui/x-data-grid";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import SendIcon from "@mui/icons-material/Send";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";

import {
    useListInvoicesQuery,
    useDeleteInvoiceMutation,
    type InvoiceListItem,
} from "../../features/invoices/invoicesApi";
import React from "react";
import { Delete, Edit, FileDownloadRounded } from "@mui/icons-material";
import { Link } from "react-router-dom";
import ConfirmDialog from "../dialogs/ConfirmDialog";

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
    const { isLoading, data } = useListInvoicesQuery();
    const [deleteInvoice] = useDeleteInvoiceMutation();
    const [selectedInvoice, setSelectedInvoice] = React.useState<InvoiceListItem | null>(null);
    const invoices = data?.items ?? [];

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
                    <Tooltip title="Edit">
                        <GridActionsCellItem
                            icon={<Edit />}
                            label="Edit"
                            color="default"
                        />
                    </Tooltip>
                    <Tooltip title="Download pdf">
                        <GridActionsCellItem
                            icon={<FileDownloadRounded />}
                            label="Export pdf"
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
    ], [handleDeleteClick]);

    return (
        <Box sx={{ flexGrow: 1, width: "100%", maxHeight: "100%", overflow: "auto" }}>
            <DataGrid
                rows={invoices}
                loading={isLoading}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: {
                            pageSize: 100,
                        },
                    },
                }}
                pageSizeOptions={[10]}
                checkboxSelection
                disableRowSelectionOnClick
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
