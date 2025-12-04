import React from "react";
import {
    Stack,
    TextField,
    Button,
    Card,
    CardContent,
    Typography,
    useColorScheme,
    Autocomplete,
    Grid,
} from "@mui/material";
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
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    useForm,
    useFieldArray,
    Controller,
} from "react-hook-form";
import { useCreateInvoiceMutation } from "../features/invoices/invoicesApi";
import {
    useListCustomersQuery,
    type Customer,
} from "../features/customers/customersApi";

type CurrencyOption = {
    code: string;
    label: string;
};

const currencyOptions: CurrencyOption[] = [
    { code: "CZK", label: "Czech koruna (CZK)" },
    { code: "EUR", label: "Euro (EUR)" },
    { code: "USD", label: "US Dollar (USD)" },
    { code: "GBP", label: "British Pound (GBP)" },
    { code: "PLN", label: "Polish Zloty (PLN)" },
];

type TaxModeOption = {
    value: number;
    label: string;
};

const taxModeOptions: TaxModeOption[] = [
    { value: 0, label: "None" },
    { value: 1, label: "VAT included" },
    { value: 2, label: "VAT excluded" },
];

type UnitOption = {
    value: string;
    label: string;
};

const unitOptions: UnitOption[] = [
    { value: "ks", label: "ks" },
    { value: "hour.", label: "hour" },
    { value: "day", label: "day" },
    { value: "litr", label: "litr" },
    { value: "kg", label: "kg" },
    { value: "g", label: "g" },
    { value: "m", label: "m" },
];

// ====== Zod schéma ======

const invoiceItemSchema = z.object({
    name: z.string().min(1, "Item name is required"),
    description: z.string().optional(),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    unit: z.string().min(1, "Unit is required"),
    unitPrice: z.coerce.number().nonnegative("Unit price must be >= 0"),
    vatRate: z.coerce.number().min(0).max(100, "VAT must be between 0 and 100"),
    discount: z.coerce.number().min(0).max(100).optional(),
});

const invoiceSchema = z.object({
    customerId: z.coerce.number().int().positive("Customer is required"),
    sequenceId: z.number().int().positive().nullable().optional(),
    issueDate: z.string().min(1, "Issue date is required"),
    dueDate: z.string().min(1, "Due date is required"),
    supplyDate: z.string().min(1, "Supply date is required"),
    currency: z.string().min(1, "Currency is required"),
    taxMode: z.coerce.number().int(),
    vatRateDefault: z.coerce.number(),
    variableSymbol: z.string().optional(),
    notePublic: z.string().optional(),
    noteInternal: z.string().optional(),
    items: z
        .array(invoiceItemSchema)
        .nonempty("At least one invoice item is required"),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

// helper na dnešní datum ve formátu YYYY-MM-DD
const today = () => new Date().toISOString().slice(0, 10);

const InvoicesForm: React.FC = () => {
    const navigate = useNavigate();
    const { colorScheme } = useColorScheme();
    const [createInvoice] = useCreateInvoiceMutation();

    const {
        handleSubmit,
        control,
        formState: { isSubmitting },
    } = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema) as any,
        defaultValues: {
            customerId: 0,
            sequenceId: null,
            issueDate: today(),
            dueDate: today(),
            supplyDate: today(),
            currency: "CZK",
            taxMode: 0,
            vatRateDefault: 21,
            variableSymbol: "",
            notePublic: "",
            noteInternal: "",
            items: [
                {
                    name: "",
                    description: "",
                    quantity: 1,
                    unit: "ks",
                    unitPrice: 0,
                    vatRate: 21,
                    discount: 0,
                },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items",
    });

    const { data: customers = [], isLoading: customersLoading } =
        useListCustomersQuery();

    const onSubmit = async (values: InvoiceFormValues) => {
        try {
            const payload = {
                ...values,
                sequenceId: null as number | null,
            };
            await createInvoice(payload).unwrap();
            navigate("/invoices");
        } catch (e) {
            console.error("Invoice save failed", e);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack direction="column" spacing={2} sx={{ flex: 1, pb: 6 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" fontWeight={600}>
                        Create invoice
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

                <Card
                    variant="outlined"
                    sx={{
                        borderRadius: 2,
                        borderColor: "divider",
                        transition: "border-color 0.2s ease-in-out",
                        bgcolor: colorScheme === "light" ? "background.default" : "#1f1f1f",
                    }}
                >
                    <CardContent sx={{ pb: 0 }}>
                        <Stack direction="column" spacing={2} sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={800}>
                                General information
                            </Typography>
                            <Stack direction="row" spacing={2}>
                                <Grid container sx={{ flex: 1 }} spacing={2}>
                                    <Grid size={{ xs: 12, sm: 12, md: 6 }}>
                                        <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                Customer *
                                            </Typography>
                                            <Controller
                                                name="customerId"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <Autocomplete<Customer, false, false, false>
                                                        options={customers}
                                                        loading={customersLoading}
                                                        getOptionLabel={(option) => option.name ?? `#${option.id}`}
                                                        value={
                                                            customers.find((c) => c.id === field.value) ?? null
                                                        }
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
                                        </Stack>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 12, md: 3 }}>
                                        <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                Sequence ID
                                            </Typography>
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
                                        </Stack>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 12, md: 3 }}>
                                        <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                Variable symbol
                                            </Typography>
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
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
                <Card
                    variant="outlined"
                    sx={{
                        borderRadius: 2,
                        borderColor: "divider",
                        transition: "border-color 0.2s ease-in-out",
                        bgcolor: colorScheme === "light" ? "background.default" : "#1f1f1f",
                    }}
                >
                    <CardContent sx={{ pb: 0 }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Stack direction="column" spacing={2} sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight={800}>
                                    Dates
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <Grid container sx={{ flex: 1 }} spacing={2}>
                                        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                                            <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                                <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                    Issue date
                                                </Typography>
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
                                            </Stack>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                                            <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                                <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                    Due date
                                                </Typography>
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
                                            </Stack>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                                            <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                                <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                    Supply date
                                                </Typography>
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
                                            </Stack>
                                        </Grid>
                                    </Grid>
                                </Stack>
                            </Stack>
                        </LocalizationProvider>
                    </CardContent>
                </Card>
                <Card
                    variant="outlined"
                    sx={{
                        borderRadius: 2,
                        borderColor: "divider",
                        transition: "border-color 0.2s ease-in-out",
                        bgcolor: colorScheme === "light" ? "background.default" : "#1f1f1f",
                    }}
                >
                    <CardContent sx={{ pb: 0 }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Stack direction="column" spacing={2} sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight={800}>
                                    Tax settings
                                </Typography>
                                <Stack direction="row" spacing={2}>
                                    <Grid container sx={{ flex: 1 }} spacing={2}>
                                        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                                            <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                                <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                    Currency
                                                </Typography>
                                                <Controller
                                                    name="currency"
                                                    control={control}
                                                    render={({ field, fieldState }) => (
                                                        <Autocomplete<CurrencyOption, false, false, false>
                                                            options={currencyOptions}
                                                            getOptionLabel={(option) => option.label}
                                                            sx={{ flex: 1 }}
                                                            value={
                                                                currencyOptions.find((opt) => opt.code === field.value) ?? null
                                                            }
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
                                            </Stack>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                                            <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                                <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                    Default VAT rate (%)
                                                </Typography>
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
                                            </Stack>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                                            <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                                <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                    Tax mode
                                                </Typography>
                                                <Controller
                                                    name="taxMode"
                                                    control={control}
                                                    render={({ field, fieldState }) => (
                                                        <Autocomplete<TaxModeOption, false, false, false>
                                                            options={taxModeOptions}
                                                            sx={{ flex: 1 }}
                                                            getOptionLabel={(option) => option.label}
                                                            value={
                                                                taxModeOptions.find((opt) => opt.value === field.value) ?? null
                                                            }
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
                                            </Stack>
                                        </Grid>
                                    </Grid>
                                </Stack>
                            </Stack>
                        </LocalizationProvider>
                    </CardContent>
                </Card>
                <Card
                    variant="outlined"
                    sx={{
                        borderRadius: 2,
                        borderColor: "divider",
                        transition: "border-color 0.2s ease-in-out",
                        bgcolor: colorScheme === "light" ? "background.default" : "#1f1f1f",
                    }}
                >
                    <CardContent sx={{ pb: 0 }}>
                        <Stack direction="column" spacing={2} sx={{ flex: 1 }}>
                            <Stack direction="row" justifyContent={"space-between"}>
                                <Typography variant="subtitle1" fontWeight={800}>
                                    Invoice items
                                </Typography>
                                <Button
                                    startIcon={<AddRounded />}
                                    variant="outlined"
                                    sx={{ textTransform: "none" }}
                                    onClick={() =>
                                        append({
                                            name: "",
                                            description: "",
                                            quantity: 1,
                                            unit: "ks",
                                            unitPrice: 0,
                                            vatRate: 21,
                                            discount: 0,
                                        })
                                    }
                                >
                                    Add item
                                </Button>
                            </Stack>
                            {fields.map((field, index) => (
                                <Card
                                    key={field.id}
                                    variant="outlined"
                                >
                                    <CardContent>
                                        <Stack direction={"column"} sx={{ flex: 1 }} spacing={2}>
                                            <Grid container sx={{ flex: 1 }} spacing={2}>
                                                <Grid size={{ xs: 12, sm: 12, md: 3 }}>
                                                    <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                                        <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                            Name
                                                        </Typography>
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
                                                    </Stack>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 12, md: 1 }}>
                                                    <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                                        <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                            Quantity
                                                        </Typography>
                                                        <Controller
                                                            name={`items.${index}.quantity`}
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
                                                    </Stack>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 12, md: 2 }}>
                                                    <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                                        <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                            Unit
                                                        </Typography>
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
                                                    </Stack>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 12, md: 2 }}>
                                                    <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                                        <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                            Unit price
                                                        </Typography>
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
                                                    </Stack>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 12, md: 2 }}>
                                                    <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                                        <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                            VAT rate (%)
                                                        </Typography>
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
                                                    </Stack>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 12, md: 2 }}>
                                                    <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                                        <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                            Discount (%)
                                                        </Typography>
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
                                                    </Stack>
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 12, md: 12 }}>
                                                    <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                                        <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                            Description
                                                        </Typography>
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
                                                    </Stack>
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
                                        </Stack>

                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>
                    </CardContent>
                </Card>


                <Card
                    variant="outlined"
                    sx={{
                        borderRadius: 2,
                        borderColor: "divider",
                        transition: "border-color 0.2s ease-in-out",
                        bgcolor: colorScheme === "light" ? "background.default" : "#1f1f1f",
                    }}
                >
                    <CardContent sx={{ pb: 0 }}>
                        <Stack direction="column" spacing={2}>
                            <Typography variant="subtitle1" fontWeight={800}>
                                Notes
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ pb: 2 }}>
                                <Grid container sx={{ flex: 1 }} spacing={2}>
                                    <Grid size={{ xs: 12, sm: 12, md: 6 }}>
                                        <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                Public note
                                            </Typography>
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
                                        </Stack>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 12, md: 6 }}>
                                        <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                Internal note
                                            </Typography>
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
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>
                <Stack direction={"row"} justifyContent="flex-end">
                    <Button
                        startIcon={<NoteAddRounded />}
                        type="submit"
                        variant="contained"
                        disableElevation
                        sx={{ textTransform: "none" }}
                        disabled={isSubmitting}
                    >
                        Issue invoice
                    </Button>
                </Stack>
            </Stack>
        </form>
    );
};

export default InvoicesForm;
