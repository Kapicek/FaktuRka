import React from "react";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
type StatusPie = {
    id: string;
    label: string;
    value: number;
    color?: string;
};

type Props = {
    totalAmount: number;
    totalCount: number;
    formatter: Intl.NumberFormat;
    pieData: StatusPie[];
};

export const TotalSummaryCard = ({ totalAmount, totalCount, formatter, pieData }: Props) => (
    <Card variant="outlined" sx={{ height: "100%" }}>
        <CardContent>
            <Stack direction={"row"} spacing={2} justifyContent={"space-between"}>
                <Stack direction={"column"}>
                    <Typography variant="body1">Total:</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, pb: 2 }}>
                        {formatter.format(totalAmount)}
                    </Typography>
                    <Typography variant="body1">
                        {totalCount} {totalCount === 1 ? "invoice" : "invoices"}
                    </Typography>
                </Stack>
                <Box sx={{ maxHeight: 150 }}>
                    <PieChart
                        series={[
                            {
                                highlightScope: { fade: "global", highlight: "item" },
                                data: pieData.length
                                    ? pieData
                                    : [
                                        { id: "Empty", value: 1, label: "No data" },
                                    ],
                                innerRadius: 35,
                                paddingAngle: 1,
                                cornerRadius: 3,
                            },
                        ]}
                        width={120}
                        height={120}
                        hideLegend
                    />
                </Box>
            </Stack>
        </CardContent>
    </Card>
);
