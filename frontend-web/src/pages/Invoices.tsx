import { Button, Stack, Typography } from '@mui/material'
import { DeleteRounded, DownloadRounded, FileOpenRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import InvoicesDatagrid from '../components/invoices/InvoicesDatagrid';
import InvoicesDashboardCharts from '../components/invoices/InvoicesDashboardCharts';

const Invoices = () => {

    const navigate = useNavigate();

    return (
        <Stack direction={"column"} spacing={2} sx={{ flex: 1, height: "100%" }}>
            <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
                <Typography variant='h5' fontWeight={600}>
                    Invoices
                </Typography>
                <Button
                    startIcon={<FileOpenRounded />}
                    variant='contained'
                    disableElevation
                    sx={{ textTransform: "none" }}
                    onClick={() => navigate('/invoices/new')}
                >
                    Issue invoice
                </Button>
            </Stack>
            <InvoicesDashboardCharts />
            <InvoicesDatagrid />
        </Stack>
    )
}

export default Invoices