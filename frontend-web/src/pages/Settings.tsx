import React from "react";
import { Button, Card, CardContent, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { selectPreferredCurrency, setCurrency } from "../features/settings/settingsSlice";
import { CURRENCY_OPTIONS } from "../constants/currencies";

type SettingsFormValues = {
    currency: string;
};

const Settings: React.FC = () => {
    const dispatch = useDispatch();
    const preferredCurrency = useSelector(selectPreferredCurrency);

    const { control, handleSubmit, reset } = useForm<SettingsFormValues>({
        defaultValues: { currency: preferredCurrency },
    });

    React.useEffect(() => {
        reset({ currency: preferredCurrency });
    }, [preferredCurrency, reset]);

    const onSubmit = (values: SettingsFormValues) => {
        dispatch(setCurrency(values.currency));
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2} sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight={600}>
                    Settings
                </Typography>
                <Card variant="outlined">
                    <CardContent>
                        <Stack spacing={2}>
                            <Typography variant="subtitle1" fontWeight={600}>
                                Currency
                            </Typography>
                            <Controller
                                name="currency"
                                control={control}
                                render={({ field }) => (
                                    <TextField select label="Default currency" {...field} fullWidth>
                                        {CURRENCY_OPTIONS.map((option) => (
                                            <MenuItem key={option.code} value={option.code}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                        </Stack>
                    </CardContent>
                </Card>
                <Stack direction="row" justifyContent="flex-end">
                    <Button type="submit" variant="contained" sx={{ textTransform: "none" }}>
                        Save settings
                    </Button>
                </Stack>
            </Stack>
        </form>
    );
};

export default Settings;
