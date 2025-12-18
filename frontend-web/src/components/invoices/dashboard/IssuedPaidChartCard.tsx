import React from "react";
import { Card, Stack, Typography, Box } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";

type Props = {
    data: Array<{ label: string; value: number; color: string }>;
};

export const IssuedPaidChartCard = ({ data }: Props) => (
    <Card sx={{ height: "100%", pt: 2 }} variant="outlined">
        <Stack>
            <Typography variant="body1" sx={{ px: 2 }}>
                Issued / Paid:
            </Typography>

            <Box sx={{ width: "100%", height: 100, top: 0 }}>
                <BarChart
                    borderRadius={4}
                    yAxis={[
                        {
                            scaleType: "band",
                            data: data.map((item) => item.label),
                            tickLabelStyle: { display: "none" },
                            tickSize: 0,
                            categoryGapRatio: 0.3,
                            barGapRatio: 0,
                            position: "none",
                        },
                    ]}
                    xAxis={[{ min: 0 }]}
                    series={[
                        {
                            id: "issued-vs-paid",
                            highlightScope: { fade: "global", highlight: "item" },
                            data: data.map((item) => item.value),
                            layout: "horizontal",
                            barLabelPlacement: "outside",
                            valueFormatter: (value) => (value ?? 0).toString(),
                            colorGetter: ({ dataIndex }) => data[dataIndex]?.color ?? data[0]?.color,
                        },
                    ]}
                    hideLegend
                    layout="horizontal"
                    margin={{ bottom: 10, top: 5 }}
                />
            </Box>
        </Stack>
    </Card>
);

