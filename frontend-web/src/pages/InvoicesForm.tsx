import React from "react";
import {
    Stack,
    TextField,
    Button,
    Card,
    CardContent,
    CardActions,
    Typography,
    IconButton,
    useColorScheme,
    Autocomplete,
    Divider,
} from "@mui/material";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
    ArrowBackIosNewRounded,
    DeleteOutline,
    AddRounded,
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
        formState: { errors, isSubmitting },
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

    const itemsErrorMessage =
        typeof (errors.items as any)?.message === "string"
            ? (errors.items as any).message
            : undefined;

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
        <Stack direction="column" spacing={2} sx={{ flex: 1, pb: 6 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" fontWeight={600}>
                    Create invoice
                </Typography>
                <Button
                    startIcon={<ArrowBackIosNewRounded />}
                    variant="contained"
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
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <CardContent sx={{ pb: 0 }}>
                        <Stack direction="column" spacing={2}>
                            {/* Základní informace */}
                            <Typography variant="h6" fontWeight={600}>
                                General information
                            </Typography>
                            <Stack direction="row" spacing={2}>
                                {/* Customer Autocomplete */}
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
                                                    label="Customer"
                                                    sx={{ flex: 1 }}
                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                />
                                            )}
                                        />
                                    )}
                                />

                                {/* Sequence ID */}
                                <Controller
                                    name="sequenceId"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            {...field}
                                            label="Sequence ID"
                                            disabled
                                            type="number"
                                            sx={{ flex: 1 }}
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                        />
                                    )}
                                />
                            </Stack>

                            <Stack direction="row" spacing={2}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <Controller
                                        name="issueDate"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <DatePicker
                                                label="Issue date"
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

                                    <Controller
                                        name="dueDate"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <DatePicker
                                                label="Due date"
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

                                    <Controller
                                        name="supplyDate"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <DatePicker
                                                label="Supply date"
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
                                </LocalizationProvider>
                            </Stack>

                            <Stack direction="row" spacing={2}>
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
                                                    label="Currency"

                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                />
                                            )}
                                        />
                                    )}
                                />
                                <Controller
                                    name="taxMode"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <Autocomplete<TaxModeOption, false, false, false>
                                            options={taxModeOptions}
                                            sx={{ flex: 1 }}
                                            getOptionLabel={(option) => option.label}
                                            // vybraná hodnota podle čísla ve formu
                                            value={
                                                taxModeOptions.find((opt) => opt.value === field.value) ?? null
                                            }
                                            onChange={(_, newValue) => {
                                                field.onChange(newValue ? newValue.value : 0);
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Tax mode"
                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                />
                                            )}
                                        />
                                    )}
                                />
                                <Controller
                                    name="vatRateDefault"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            {...field}
                                            label="Default VAT rate"
                                            type="number"
                                            sx={{ flex: 1 }}
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                        />
                                    )}
                                />
                            </Stack>

                            <Stack direction="row" spacing={2}>
                                <Controller
                                    name="variableSymbol"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            {...field}
                                            label="Variable symbol"
                                            sx={{ flex: 1 }}
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                        />
                                    )}
                                />
                            </Stack>

                            {/* Veřejná / interní poznámka */}
                            <Stack direction="row" spacing={2} sx={{ pb: 4 }}>
                                <Controller
                                    name="notePublic"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            {...field}
                                            label="Public note"
                                            multiline
                                            minRows={4}
                                            sx={{ flex: 1 }}
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                        />
                                    )}
                                />
                                <Controller
                                    name="noteInternal"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <TextField
                                            {...field}
                                            label="Internal note"
                                            multiline
                                            minRows={4}
                                            sx={{ flex: 1 }}
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                        />
                                    )}
                                />
                            </Stack>

                            <Divider />

                            {/* Položky faktury */}
                            <Stack direction="column" spacing={2}>
                                <Typography variant="h6" fontWeight={600}>
                                    Items
                                </Typography>

                                {fields.map((field, index) => (
                                    <Card
                                        key={field.id}
                                        variant="outlined"
                                        sx={{ borderRadius: 1.5, p: 2, mb: 1 }}
                                    >
                                        <Stack direction="row" justifyContent="space-between" mb={1}>
                                            <Typography variant="subtitle2">
                                                Item {index + 1}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => remove(index)}
                                                disabled={fields.length === 1}
                                            >
                                                <DeleteOutline fontSize="small" />
                                            </IconButton>
                                        </Stack>

                                        <Stack direction="row" spacing={2} mb={1}>
                                            <Controller
                                                name={`items.${index}.name`}
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <TextField
                                                        {...field}
                                                        label="Name"
                                                        sx={{ flex: 2 }}
                                                        error={!!fieldState.error}
                                                        helperText={fieldState.error?.message}
                                                    />
                                                )}
                                            />
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
                                                                label="Unit"

                                                                error={!!fieldState.error}
                                                                helperText={fieldState.error?.message}
                                                            />
                                                        )}
                                                    />
                                                )}
                                            />
                                        </Stack>

                                        <Stack direction="row" spacing={2} mb={1}>
                                            <Controller
                                                name={`items.${index}.quantity`}
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <TextField
                                                        {...field}
                                                        label="Quantity"
                                                        type="number"
                                                        sx={{ flex: 1 }}
                                                        error={!!fieldState.error}
                                                        helperText={fieldState.error?.message}
                                                    />
                                                )}
                                            />
                                            <Controller
                                                name={`items.${index}.unitPrice`}
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <TextField
                                                        {...field}
                                                        label="Unit price"
                                                        type="number"
                                                        sx={{ flex: 1 }}
                                                        error={!!fieldState.error}
                                                        helperText={fieldState.error?.message}
                                                    />
                                                )}
                                            />
                                            <Controller
                                                name={`items.${index}.vatRate`}
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <TextField
                                                        {...field}
                                                        label="VAT rate %"

                                                        type="number"
                                                        sx={{ flex: 1 }}
                                                        error={!!fieldState.error}
                                                        helperText={fieldState.error?.message}
                                                    />
                                                )}
                                            />
                                            <Controller
                                                name={`items.${index}.discount`}
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <TextField
                                                        {...field}
                                                        label="Discount %"
                                                        type="number"
                                                        sx={{ flex: 1 }}
                                                        error={!!fieldState.error}
                                                        helperText={fieldState.error?.message}
                                                    />
                                                )}
                                            />
                                        </Stack>

                                        <Controller
                                            name={`items.${index}.description`}
                                            control={control}
                                            render={({ field, fieldState }) => (
                                                <TextField
                                                    {...field}
                                                    label="Description"
                                                    multiline
                                                    minRows={4}
                                                    fullWidth
                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                />
                                            )}
                                        />
                                    </Card>
                                ))}

                                <Button
                                    startIcon={<AddRounded />}
                                    variant="outlined"
                                    sx={{ alignSelf: "flex-start", mt: 4 }}
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

                                {itemsErrorMessage && (
                                    <Typography color="error" variant="body2">
                                        {itemsErrorMessage}
                                    </Typography>
                                )}
                            </Stack>
                        </Stack>
                    </CardContent>

                    <CardActions sx={{ justifyContent: "flex-end", p: 2 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            disableElevation
                            sx={{ textTransform: "none" }}
                            disabled={isSubmitting}
                        >
                            Save
                        </Button>
                    </CardActions>
                </form>
            </Card>
        </Stack>
    );
};

export default InvoicesForm;
