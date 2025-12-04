import Box from '@mui/material/Box';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useListCustomersQuery } from '../../features/customers/customersApi';

const columns: GridColDef[] = [
    {
        field: 'name',
        headerName: 'Name',
        width: 140,
    },
    {
        field: 'ico',
        headerName: 'ICO',
        width: 200,
    },
    {
        field: 'email',
        headerName: 'Email',
        width: 250,
    },
    {
        field: 'city',
        headerName: 'City',
        width: 200,
    },
];


export default function CustomersDatagrid() {

    const { isLoading, data } = useListCustomersQuery();

    return (

        <Box sx={{ flexGrow: 1, width: '100%' }}>
            <DataGrid
                rows={data}
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
        </Box>
    );
}