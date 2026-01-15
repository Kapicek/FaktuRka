import React from "react";
import { Stack, TextField, Button, Typography, Autocomplete, Grid } from "@mui/material";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
    DeleteOutline,
    AddRounded,
    ArrowBackRounded,
    NoteAddRounded,
} from "@mui/icons-material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    useForm,
    useFieldArray,
    Controller,
} from "react-hook-form";
import { useCreateInvoiceMutation, useGetInvoiceQuery, useUpdateInvoiceMutation } from "../features/invoices/invoicesApi";
import {
    useListCustomersQuery,
    type Customer,
} from "../features/customers/customersApi";
import { useSelector } from "react-redux";
import { selectPreferredCurrency } from "../features/settings/settingsSlice";
import { CURRENCY_OPTIONS, type CurrencyOption } from "../constants/currencies";
import { FormCard } from "../components/forms/FormCard";
import { FormField } from "../components/forms/FormField";
import {
    defaultInvoiceItem,
    getDefaultInvoiceValues,
    invoiceSchema,
    taxModeOptions,
    type InvoiceFormValues,
    type TaxModeOption,
    unitOptions,
    type UnitOption,
} from "./invoicesFormSchema";


const InvoicesForm: React.FC = () => {
    const navigate = useNavigate();
    const preferredCurrency = useSelector(selectPreferredCurrency);
    const { id: editInvoiceParam } = useParams<{ id?: string }>();
    const location = useLocation();
    const duplicateInvoiceId =
        (location.state as { duplicateInvoiceId?: number } | undefined)
            ?.duplicateInvoiceId;
    const editInvoiceId = editInvoiceParam ? Number(editInvoiceParam) : undefined;
    const [createInvoice] = useCreateInvoiceMutation();
    const [updateInvoice] = useUpdateInvoiceMutation();
    const templateInvoiceId = editInvoiceId ?? duplicateInvoiceId;
    const { data: templateInvoice, isFetching: isFetchingTemplate } = useGetInvoiceQuery(
        templateInvoiceId ?? 0,
        { skip: !templateInvoiceId }
    );
    const mode: "create" | "duplicate" | "edit" = editInvoiceId
        ? "edit"
        : duplicateInvoiceId
            ? "duplicate"
            : "create";

    const {
        handleSubmit,
        control,
        reset,
        setValue,
        formState: { isSubmitting },
    } = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema) as any,
        defaultValues: getDefaultInvoiceValues(preferredCurrency),
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const { data: customersData, isLoading: customersLoading } =
        useListCustomersQuery();
    const customers = customersData?.items ?? [];

    React.useEffect(() => {
        if (!templateInvoice) return;
        reset({
            customerId: templateInvoice.customerId ?? 0,
            sequenceId: templateInvoice.sequenceId ?? null,
            issueDate: templateInvoice.issueDate,
            dueDate: templateInvoice.dueDate,
            supplyDate: templateInvoice.supplyDate ?? templateInvoice.issueDate,
            currency: templateInvoice.currency,
            taxMode: templateInvoice.taxMode,
            vatRateDefault: templateInvoice.vatRateDefault,
            variableSymbol: templateInvoice.variableSymbol ?? "",
            notePublic: templateInvoice.notePublic ?? "",
            noteInternal: templateInvoice.noteInternal ?? "",
            items: templateInvoice.items.map((item) => ({
                name: item.name,
                description: item.description ?? "",
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                vatRate: item.vatRate,
                discount: item.discount ?? 0,
            })),
        });
    }, [templateInvoice, reset]);

    React.useEffect(() => {
        if (mode === "create" && !templateInvoiceId) {
            setValue("currency", preferredCurrency);
        }
    }, [mode, templateInvoiceId, preferredCurrency, setValue]);

    if (templateInvoiceId && isFetchingTemplate) {
        return (
            <Stack direction="column" spacing={2} sx={{ flex: 1, pb: 6 }}>
                <Typography>
                    {mode === "edit" ? "Loading invoice for editing…" : "Loading invoice data…"}
                </Typography>
            </Stack>
        );
    }

    const onSubmit = async (values: InvoiceFormValues) => {
        try {
            const payload = {
                ...values,
                sequenceId: values.sequenceId ?? null,
            };
            if (editInvoiceId) {
                await updateInvoice({ id: editInvoiceId, body: payload }).unwrap();
                navigate(`/invoices/${editInvoiceId}`);
            } else {
                await createInvoice(payload).unwrap();
                navigate("/invoices");
            }
        } catch (e) {
            console.error("Invoice save failed", e);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack direction="column" spacing={2} sx={{ flex: 1, pb: 6 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" fontWeight={600}>
                        {mode === "edit"
                            ? `Edit invoice ${templateInvoice?.numberFull ?? ""}`
                            : mode === "duplicate"
                                ? "Duplicate invoice"
                                : "Create invoice"}
                    </Typography>
                    <Button
                        startIcon={<ArrowBackRounded />}
                        variant="outlined"
                        disableElevation
                        sx={{ textTransform: "none" }}
                        onClick={() => navigate("/invoices")}
                    >
                        Back
                    </Button>
                </Stack>

                <FormCard title="General information" contentProps={{ sx: { pb: 0 } }}>
                    <Grid container sx={{ flex: 1 }} spacing={2}>
                        <Grid size={{ xs: 12, sm: 12, md: 6 }}>
                            <FormField label="Customer *">
                                <Controller
                                    name="customerId"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <Autocomplete<Customer, false, false, false>
                                            options={customers}
                                            loading={customersLoading}
                                            getOptionLabel={(option) => option.name ?? `#${option.id}`}
                                            value={customers.find((c) => c.id === field.value) ?? null}
                                            onChange={(_, newValue) => {
                                                field.onChange(newValue ? newValue.id : 0);
                                            }}
                                            sx={{ flex: 1 }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    sx={{ flex: 1 }}
                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                    placeholder="Company s. r. o."
                                                />
                                            )}
                                        />
                                    )}
                                />
                            </FormField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 12, md: 3 }}>
                            <FormField label="Sequence ID">
                                <Controller
                                    name="sequenceId"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            {...field}
                                            disabled
                                            type="number"
                                            sx={{ flex: 1 }}
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                            placeholder="24"
                                        />
                                    )}
                                />
                            </FormField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 12, md: 3 }}>
                            <FormField label="Variable symbol">
                                <Controller
                                    name="variableSymbol"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            {...field}
                                            sx={{ flex: 1 }}
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                            placeholder="2024001"
                                            type="number"
                                        />
                                    )}
                                />
                            </FormField>
                        </Grid>
                    </Grid>
                </FormCard>

                <FormCard title="Dates" contentProps={{ sx: { pb: 0 } }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Grid container sx={{ flex: 1 }} spacing={2}>
                            <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                                <FormField label="Issue date *">
                                    <Controller
                                        name="issueDate"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <DatePicker
                                                value={field.value ? dayjs(field.value) : null}
                                                onChange={(newValue) => {
                                                    field.onChange(newValue ? newValue.format("YYYY-MM-DD") : "");
                                                }}
                                                slotProps={{
                                                    textField: {
                                                        sx: { flex: 1 },
                                                        error: !!fieldState.error,
                                                        helperText: fieldState.error?.message,
                                                        size: "medium",
                                                    },
                                                }}
                                            />
                                        )}
                                    />
                                </FormField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                                <FormField label="Due date *">
                                    <Controller
                                        name="dueDate"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <DatePicker
                                                value={field.value ? dayjs(field.value) : null}
                                                onChange={(newValue) => {
                                                    field.onChange(newValue ? newValue.format("YYYY-MM-DD") : "");
                                                }}
                                                slotProps={{
                                                    textField: {
                                                        sx: { flex: 1 },
                                                        error: !!fieldState.error,
                                                        helperText: fieldState.error?.message,
                                                        size: "medium",
                                                    },
                                                }}
                                            />
                                        )}
                                    />
                                </FormField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                                <FormField label="Supply date">
                                    <Controller
                                        name="supplyDate"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <DatePicker
                                                value={field.value ? dayjs(field.value) : null}
                                                onChange={(newValue) => {
                                                    field.onChange(newValue ? newValue.format("YYYY-MM-DD") : "");
                                                }}
                                                slotProps={{
                                                    textField: {
                                                        sx: { flex: 1 },
                                                        error: !!fieldState.error,
                                                        helperText: fieldState.error?.message,
                                                        size: "medium",
                                                    },
                                                }}
                                            />
                                        )}
                                    />
                                </FormField>
                            </Grid>
                        </Grid>
                    </LocalizationProvider>
                </FormCard>

                <FormCard title="Tax settings" contentProps={{ sx: { pb: 0 } }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Grid container sx={{ flex: 1 }} spacing={2}>
                            <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                                <FormField label="Currency">
                                    <Controller
                                        name="currency"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <Autocomplete<CurrencyOption, false, false, false>
                                                options={CURRENCY_OPTIONS}
                                                getOptionLabel={(option) => option.label}
                                                sx={{ flex: 1 }}
                                                value={CURRENCY_OPTIONS.find((opt) => opt.code === field.value) ?? null}
                                                onChange={(_, newValue) => {
                                                    field.onChange(newValue ? newValue.code : "");
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        error={!!fieldState.error}
                                                        helperText={fieldState.error?.message}
                                                    />
                                                )}
                                            />
                                        )}
                                    />
                                </FormField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                                <FormField label="Default VAT rate (%)">
                                    <Controller
                                        name="vatRateDefault"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <TextField
                                                {...field}
                                                type="number"
                                                sx={{ flex: 1 }}
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                            />
                                        )}
                                    />
                                </FormField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                                <FormField label="Tax mode">
                                    <Controller
                                        name="taxMode"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <Autocomplete<TaxModeOption, false, false, false>
                                                options={taxModeOptions}
                                                sx={{ flex: 1 }}
                                                getOptionLabel={(option) => option.label}
                                                value={taxModeOptions.find((opt) => opt.value === field.value) ?? null}
                                                onChange={(_, newValue) => {
                                                    field.onChange(newValue ? newValue.value : 0);
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        error={!!fieldState.error}
                                                        helperText={fieldState.error?.message}
                                                    />
                                                )}
                                            />
                                        )}
                                    />
                                </FormField>
                            </Grid>
                        </Grid>
                    </LocalizationProvider>
                </FormCard>
                <FormCard contentProps={{ sx: { pb: 0 } }}>
                    <Stack direction="row" justifyContent={"space-between"} sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={800}>
                            Invoice items *
                        </Typography>
                        <Button
                            startIcon={<AddRounded />}
                            variant="outlined"
                            sx={{ textTransform: "none" }}
                            onClick={() => append(defaultInvoiceItem)}
                        >
                            Add item
                        </Button>
                    </Stack>

                    {fields.map((field, index) => (
                        <FormCard key={field.id} variant="outlined">
                            <Grid container sx={{ flex: 1 }} spacing={2}>
                                <Grid size={{ xs: 12, sm: 12, md: 3 }}>
                                    <FormField label="Name *">
                                        <Controller
                                            name={`items.${index}.name`}
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    fullWidth
                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                    placeholder="Item name"
                                                />
                                            )}
                                        />
                                    </FormField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 12, md: 1 }}>
                                    <FormField label="Quantity *">
                                        <Controller
                                            name={`items.${index}.quantity`}
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    type="number"
                                                    sx={{ flex: 1 }}
                                                    error={!!fieldState.error}
                                                    helperText={!!fieldState.error ? fieldState.error.message : undefined}
                                                />
                                            )}
                                        />
                                    </FormField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 12, md: 2 }}>
                                    <FormField label="Unit *">
                                        <Controller
                                            name={`items.${index}.unit`}
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <Autocomplete<UnitOption, false, false, false>
                                                    options={unitOptions}
                                                    getOptionLabel={(option) => option.label}
                                                    value={unitOptions.find((opt) => opt.value === field.value) ?? null}
                                                    onChange={(_, newValue) => {
                                                        field.onChange(newValue ? newValue.value : "");
                                                    }}
                                                    sx={{ flex: 1 }}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            error={!!fieldState.error}
                                                            helperText={fieldState.error?.message}
                                                        />
                                                    )}
                                                />
                                            )}
                                        />
                                    </FormField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 12, md: 2 }}>
                                    <FormField label="Unit price *">
                                        <Controller
                                            name={`items.${index}.unitPrice`}
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    type="number"
                                                    sx={{ flex: 1 }}
                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                />
                                            )}
                                        />
                                    </FormField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 12, md: 2 }}>
                                    <FormField label="VAT rate (%)">
                                        <Controller
                                            name={`items.${index}.vatRate`}
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    type="number"
                                                    sx={{ flex: 1 }}
                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                />
                                            )}
                                        />
                                    </FormField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 12, md: 2 }}>
                                    <FormField label="Discount (%)">
                                        <Controller
                                            name={`items.${index}.discount`}
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    type="number"
                                                    sx={{ flex: 1 }}
                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                />
                                            )}
                                        />
                                    </FormField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 12, md: 12 }}>
                                    <FormField label="Description">
                                        <Controller
                                            name={`items.${index}.description`}
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    multiline
                                                    minRows={3}
                                                    fullWidth
                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                    placeholder="Additional details about the item"
                                                />
                                            )}
                                        />
                                    </FormField>
                                </Grid>
                            </Grid>
                            <Stack direction={"row"} justifyContent={"flex-end"} alignItems={"center"}>
                                <Button
                                    startIcon={<DeleteOutline />}
                                    variant="outlined"
                                    onClick={() => remove(index)}
                                    disabled={fields.length === 1}
                                    color="error"
                                    sx={{ textTransform: "none" }}
                                >
                                    Remove
                                </Button>
                            </Stack>
                        </FormCard>
                    ))}
                </FormCard>


                <FormCard title="Notes" contentProps={{ sx: { pb: 0 } }}>
                    <Grid container sx={{ flex: 1 }} spacing={2}>
                        <Grid size={{ xs: 12, sm: 12, md: 6 }}>
                            <FormField label="Public note">
                                <Controller
                                    name="notePublic"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            {...field}
                                            multiline
                                            minRows={4}
                                            sx={{ flex: 1 }}
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                            placeholder="This note will be visible to the customer"
                                        />
                                    )}
                                />
                            </FormField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 12, md: 6 }}>
                            <FormField label="Internal note">
                                <Controller
                                    name="noteInternal"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            {...field}
                                            multiline
                                            minRows={4}
                                            sx={{ flex: 1 }}
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                            placeholder="This note will be visible only to your team"
                                        />
                                    )}
                                />
                            </FormField>
                        </Grid>
                    </Grid>
                </FormCard>
                <Stack direction={"row"} justifyContent="flex-end">
                    <Button
                        startIcon={<NoteAddRounded />}
                        type="submit"
                        variant="contained"
                        disableElevation
                        sx={{ textTransform: "none" }}
                        disabled={isSubmitting}
                    >
                        {mode === "edit" ? "Save changes" : "Issue invoice"}
                    </Button>
                </Stack>
            </Stack>
        </form>
    );
};

export default InvoicesForm;
