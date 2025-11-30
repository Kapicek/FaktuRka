import Box from "@mui/material/Box";
import { Chip, type ChipProps } from "@mui/material";
import {
    DataGrid,
    type GridColDef,
} from "@mui/x-data-grid";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import SendIcon from "@mui/icons-material/Send";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";

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

const columns: GridColDef[] = [
    {
        field: "numberFull",
        headerName: "Invoice Number",
        width: 150,
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
        width: 150,
    },
    {
        field: "dueDate",
        headerName: "Due Date",
        width: 150,
    },
    {
        field: "customerName",
        headerName: "Customer Name",
        width: 200,
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
];

export default function InvoicesDatagrid() {
    const { isLoading, data = [] } = useListInvoicesQuery();

    return (
        <Box sx={{ flexGrow: 1, width: "100%", maxHeight: "100%", overflow: "auto" }}>
            <DataGrid
                rows={data}
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
        </Box>
    );
}
