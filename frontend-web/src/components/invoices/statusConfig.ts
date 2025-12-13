import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import SendIcon from "@mui/icons-material/Send";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import type { ChipProps } from "@mui/material";
import type { ElementType } from "react";

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
    icon: ElementType;
};

export const STATUS_CONFIG: Record<InvoiceStatus, StatusConfig> = {
    [InvoiceStatus.Draft]: {
        label: "Draft",
        color: "default",
        icon: DescriptionOutlinedIcon,
    },
    [InvoiceStatus.Issued]: {
        label: "Issued",
        color: "info",
        icon: HourglassEmptyIcon,
    },
    [InvoiceStatus.Sent]: {
        label: "Sent",
        color: "primary",
        icon: SendIcon,
    },
    [InvoiceStatus.Overdue]: {
        label: "Overdue",
        color: "warning",
        icon: WarningAmberIcon,
    },
    [InvoiceStatus.Paid]: {
        label: "Paid",
        color: "success",
        icon: CheckCircleOutlineIcon,
    },
    [InvoiceStatus.Cancelled]: {
        label: "Cancelled",
        color: "error",
        icon: CancelOutlinedIcon,
    },
};
