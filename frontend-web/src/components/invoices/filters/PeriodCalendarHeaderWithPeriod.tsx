import React from "react";
import { Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { PickersCalendarHeader } from "@mui/x-date-pickers/PickersCalendarHeader";
import type { PickersCalendarHeaderProps } from "@mui/x-date-pickers/PickersCalendarHeader";
import type { PeriodType } from "../filterTypes";
import { PeriodFilterContext } from "./PeriodFilterContext";
import { PERIOD_TYPE_LABELS } from "./periodUtils";

export const PeriodCalendarHeaderWithPeriod = (props: PickersCalendarHeaderProps) => {
    const ctx = React.useContext(PeriodFilterContext);

    return (
        <Stack spacing={1} sx={{ px: 1, pt: 1 }}>
            <PickersCalendarHeader {...props} />
            {ctx && (
                <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={ctx.periodType}
                    onChange={(_event, nextValue: PeriodType | null) => {
                        if (nextValue) ctx.onChange(nextValue);
                    }}
                    sx={{
                        width: "100%",
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        pb: 1,
                    }}
                >
                    {(Object.keys(PERIOD_TYPE_LABELS) as PeriodType[]).map((type) => (
                        <ToggleButton
                            key={type}
                            value={type}
                            disableRipple
                            size="small"
                            sx={{
                                borderRadius: 1,
                                borderColor: "divider",
                                px: 1,
                                "&.Mui-selected": {
                                    bgcolor: "primary.main",
                                    color: "primary.contrastText",
                                },
                            }}
                        >
                            {PERIOD_TYPE_LABELS[type]}
                        </ToggleButton>
                    ))}
                </ToggleButtonGroup>
            )}
        </Stack>
    );
};

