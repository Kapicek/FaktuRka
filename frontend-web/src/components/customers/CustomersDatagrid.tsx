import Box from "@mui/material/Box";
import { Stack, Tooltip } from "@mui/material";
import {
    DataGrid,
    type GridColDef,
    GridActionsCellItem,
} from "@mui/x-data-grid";
import React from "react";
import {
    useListCustomersQuery,
    useDeleteCustomerMutation,
    type Customer,
} from "../../features/customers/customersApi";
import { Delete, Edit } from "@mui/icons-material";
import ConfirmDialog from "../dialogs/ConfirmDialog";
import { useNavigate } from "react-router-dom";

export default function CustomersDatagrid() {
    const { isLoading, data } = useListCustomersQuery();
    const [deleteCustomer] = useDeleteCustomerMutation();
    const customers = data ?? [];
    const navigate = useNavigate();

    const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);

    const handleDeleteClick = React.useCallback((customer: Customer) => {
        setSelectedCustomer(customer);
    }, []);

    const handleCloseDialog = () => setSelectedCustomer(null);

    const handleConfirmDelete = async () => {
        if (!selectedCustomer) return;
        try {
            await deleteCustomer(selectedCustomer.id).unwrap();
        } catch (error) {
            console.error("Failed to delete customer", error);
        } finally {
            setSelectedCustomer(null);
        }
    };

    const columns = React.useMemo<GridColDef[]>(() => [
        {
            field: "name",
            headerName: "Name",
            width: 180,
        },
        {
            field: "ico",
            headerName: "ICO",
            width: 150,
        },
        {
            field: "email",
            headerName: "Email",
            width: 220,
        },
        {
            field: "city",
            headerName: "City",
            width: 160,
        },
        {
            field: "actions",
            type: "actions",
            headerName: "Actions",
            width: 100,
            renderCell: (params) => (
                <Stack direction="row" spacing={0}>
                    <Tooltip title="Edit customer">
                        <GridActionsCellItem
                            icon={<Edit />}
                            label="Edit"
                            onClick={() => navigate(`/customers/${params.row.id}/update`)}
                            color="default"
                        />
                    </Tooltip>
                    <Tooltip title="Delete customer">
                        <GridActionsCellItem
                            icon={<Delete />}
                            label="Delete"
                            onClick={() => handleDeleteClick(params.row as Customer)}
                            color="default"
                        />
                    </Tooltip>
                </Stack>
            ),
        },
    ], [handleDeleteClick, navigate]);

    return (
        <Box sx={{ flexGrow: 1, width: "100%" }}>
            <DataGrid
                rows={customers}
                loading={isLoading}
                columns={columns}
                initialState={{
                    pagination: {
                        paginationModel: {
                            pageSize: 5,
                        },
                    },
                }}
                pageSizeOptions={[5]}
                checkboxSelection
                disableRowSelectionOnClick
            />
            <ConfirmDialog
                open={Boolean(selectedCustomer)}
                title="Delete customer"
                message={
                    selectedCustomer
                        ? `Are you sure you want to delete ${selectedCustomer.name ?? `customer #${selectedCustomer.id}`}?`
                        : ""
                }
                okLabel="Delete"
                onClose={handleCloseDialog}
                onConfirm={handleConfirmDelete}
            />
        </Box>
    );
}
