import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
} from "@mui/material";

export type ConfirmDialogProps = {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onClose: () => void;
    okLabel?: string;
    closeLabel?: string;
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    title,
    message,
    onConfirm,
    onClose,
    okLabel = "OK",
    closeLabel = "Close",
}) => (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
            <DialogContentText>{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>{closeLabel}</Button>
            <Button onClick={onConfirm} variant="contained">
                {okLabel}
            </Button>
        </DialogActions>
    </Dialog>
);

export default ConfirmDialog;
