import { Button, Stack, Typography } from '@mui/material';
import { NoteAddRounded, FileDownloadRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import InvoicesDatagrid from '../components/invoices/InvoicesDatagrid';
import InvoicesDashboardCharts from '../components/invoices/InvoicesDashboardCharts';
import React from 'react';

const Invoices = () => {
    const navigate = useNavigate();
    const [exportContext, setExportContext] = React.useState<{
        selectedCount: number;
        isExporting: boolean;
        exportSelected?: () => void;
    }>({
        selectedCount: 0,
        isExporting: false,
    });

    return (
        <Stack direction={"column"} spacing={2} sx={{ flex: 1 }}>
            <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
                <Typography variant='h5' fontWeight={600}>
                    Invoices
                </Typography>
                <Stack direction="row" spacing={1}>
                    <Button
                        startIcon={<FileDownloadRounded />}
                        variant='outlined'
                        sx={{ textTransform: "none" }}
                        disabled={!exportContext.selectedCount || exportContext.isExporting || !exportContext.exportSelected}
                        onClick={() => exportContext.exportSelected?.()}
                    >
                        {exportContext.isExporting ? "Exporting..." : "Export selected"}
                    </Button>
                    <Button
                        startIcon={<NoteAddRounded />}
                        variant='contained'
                        disableElevation
                        sx={{ textTransform: "none" }}
                        onClick={() => navigate('/invoices/new')}
                    >
                        Issue invoice
                    </Button>
                </Stack>
            </Stack>
            <InvoicesDashboardCharts />
            <InvoicesDatagrid onSelectionContextChange={setExportContext} />
        </Stack>
    );
}

export default Invoices
