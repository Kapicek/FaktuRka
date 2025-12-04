import { ArrowBackRounded } from '@mui/icons-material'
import { Button, Stack, Typography } from '@mui/material'
import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const InvoicesDetail = () => {

    const params = useParams<{ id: string }>()
    const navigate = useNavigate();

    return (
        <Stack direction={"column"} spacing={2} sx={{ flex: 1, height: "100%" }}>
            <Stack direction={"row"} justifyContent={"space-between"} alignItems={"center"}>
                <Typography variant='h5' fontWeight={600}>
                    {`Invoice # ${params.id}`}
                </Typography>
                <Button
                    startIcon={<ArrowBackRounded />}
                    variant='outlined'
                    disableElevation
                    sx={{ textTransform: "none" }}
                    onClick={() => navigate('/invoices')}
                >
                    Back
                </Button>
            </Stack>
        </Stack>
    )
}

export default InvoicesDetail