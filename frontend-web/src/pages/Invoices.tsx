import { Avatar, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material';
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
                {(() => {
                    const exportDisabled = !exportContext.selectedCount || exportContext.isExporting || !exportContext.exportSelected;
                    return (
                        <Stack direction="row" spacing={1}>
                            <Button
                                startIcon={<FileDownloadRounded />}
                                variant='outlined'
                                sx={{ textTransform: "none", display: { xs: 'none', md: 'inline-flex' }, backgroundColor: 'background.default' }}
                                disabled={exportDisabled}
                                onClick={() => exportContext.exportSelected?.()}
                            >
                                {exportContext.isExporting ? "Exporting..." : "Export selected"}
                            </Button>
                            <Tooltip title={exportDisabled ? "Select invoices to export" : "Export selected invoices"}>
                                <span>
                                    <IconButton
                                        sx={{ display: { xs: 'inline-flex', md: 'none' }, p: 0 }}
                                        disabled={exportDisabled}
                                        onClick={() => exportContext.exportSelected?.()}
                                    >
                                        <Avatar
                                            variant="circular"
                                            sx={{
                                                bgcolor: 'background.default',
                                                border: '1px solid',
                                                borderColor: exportDisabled ? 'divider' : 'primary.main',
                                                width: 40,
                                                height: 40,
                                            }}
                                        >
                                            <FileDownloadRounded sx={{ color: exportDisabled ? 'text.disabled' : 'primary.main' }} />
                                        </Avatar>
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Button
                                startIcon={<NoteAddRounded />}
                                variant='contained'
                                disableElevation
                                sx={{ textTransform: "none", display: { xs: 'none', md: 'inline-flex' } }}
                                onClick={() => navigate('/invoices/new')}
                            >
                                Issue invoice
                            </Button>
                            <Tooltip title="Issue new invoice">
                                <span>
                                    <IconButton
                                        sx={{ display: { xs: 'inline-flex', md: 'none' }, p: 0 }}
                                        onClick={() => navigate('/invoices/new')}
                                    >
                                        <Avatar
                                            variant="circular"
                                            sx={{
                                                bgcolor: 'primary.main',
                                                color: 'primary.contrastText',
                                                width: 40,
                                                height: 40,
                                            }}
                                        >
                                            <NoteAddRounded />
                                        </Avatar>
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Stack>
                    );
                })()}
            </Stack>
            <InvoicesDashboardCharts />
            <InvoicesDatagrid onSelectionContextChange={setExportContext} />
        </Stack>
    );
}

export default Invoices
