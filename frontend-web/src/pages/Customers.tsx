import { Button, Stack, Typography } from '@mui/material'
import CustomersDatagrid from '../components/customers/CustomersDatagrid';
import { PersonAddAlt1Rounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Customers = () => {

    const navigate = useNavigate();

    return (
        <Stack direction={"column"} spacing={2} sx={{ flex: 1, height: "100%" }}>
            {/* <BreadcrumbsNav entityLabel="Customer" basePath="/customers" withHome /> */}
            <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
                <Typography variant='h5' fontWeight={600}>
                    Customers
                </Typography>
                <Button
                    startIcon={<PersonAddAlt1Rounded />}
                    variant='contained'
                    disableElevation
                    sx={{ textTransform: "none" }}
                    onClick={() => navigate('/customers/new')}
                >
                    Add Customer
                </Button>
            </Stack>
            <CustomersDatagrid />
        </Stack>
    )
}

export default Customers