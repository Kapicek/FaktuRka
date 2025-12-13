import React, { useEffect, useState } from "react";
import {
    Stack,
    TextField,
    Button,
    Card,
    CardContent,
    useColorScheme,
    Typography,
    Autocomplete,
    Grid,
} from "@mui/material";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    useCreateCustomerMutation,
    useGetCustomerQuery,
    useUpdateCustomerMutation,
    useSearchAresQuery,
    useLazyGetAresByIcoQuery,
    type AresSearchItem,
    type AresDetail,
} from "../features/customers/customersApi";

import { ArrowBackRounded, PersonAddAlt1Rounded } from "@mui/icons-material";

/** ====== Zod schema & typy ====== */

const icoRegex = /^[0-9]{8}$/;
const zipRegex = /^(\d{5}|\d{3}\s?\d{2})$/;

const customerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    ico: z
        .string()
        .trim()
        .optional()
        .or(z.literal(""))
        .refine(
            (val) => !val || icoRegex.test(val),
            "IČO must have 8 digits"
        ),
    dic: z.string().trim().optional(),
    legalForm: z.string().trim().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().trim().optional(),
    note: z.string().trim().optional(),

    addressLine1: z.string().trim().optional(),
    addressLine2: z.string().trim().optional(),
    city: z.string().trim().optional(),
    zip: z
        .string()
        .trim()
        .optional()
        .or(z.literal(""))
        .refine(
            (val) => !val || zipRegex.test(val),
            "ZIP must be 5 digits (e.g. 12345 or 123 45)"
        ),
    countryCode: z.string().trim().optional(),
    addressDisplay: z.string().trim().optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

const formatAddressDisplay = (
    line1?: string | null,
    zip?: string | null,
    city?: string | null
) => {
    const cityPart = [zip, city].filter(Boolean).join(" ");
    return [line1, cityPart].filter(Boolean).join(", ");
};

const CustomersForm: React.FC = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { id } = useParams<{ id: string }>();
    const isUpdate = Boolean(id && pathname.includes("update"));

    const [createCustomer] = useCreateCustomerMutation();
    const [updateCustomer] = useUpdateCustomerMutation();

    const { data: existingCustomer, isLoading: isLoadingExisting } =
        useGetCustomerQuery(id ?? "", {
            skip: !isUpdate || !id,
        });

    const {
        handleSubmit,
        control,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            name: "",
            ico: "",
            dic: "",
            legalForm: "",
            email: "",
            phone: "",
            note: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            zip: "",
            countryCode: "CZ",
            addressDisplay: "",
        },
    });

    const [aresSearchInput, setAresSearchInput] = useState("");
    const [selectedAresOption, setSelectedAresOption] =
        useState<AresSearchItem | null>(null);
    const { colorScheme } = useColorScheme();

    /** ====== ARES – search & detail ====== */

    const shouldSearchAres = aresSearchInput.trim().length >= 3;

    const {
        data: aresOptions = [],
        isFetching: isSearchingAres,
    } = useSearchAresQuery(
        { query: aresSearchInput.trim(), limit: 10 },
        { skip: !shouldSearchAres }
    );

    const [fetchAresDetail] = useLazyGetAresByIcoQuery();

    const applyAresDetailToForm = (detail?: AresDetail | null) => {
        if (!detail) return;

        if (detail.obchodniJmeno) {
            setValue("name", detail.obchodniJmeno);
        }
        if (detail.ico) {
            setValue("ico", detail.ico);
        }
        if (detail.dic) {
            setValue("dic", detail.dic);
        }
        if (detail.pravniForma) {
            setValue("legalForm", detail.pravniForma);
        }

        const s = detail.sidlo;
        if (s) {
            const streetPart = [
                s.nazevUlice,
                s.cisloDomovni,
                s.cisloOrientacni,
                s.cisloOrientacniPismeno,
            ]
                .filter(Boolean)
                .join(" ");

            const city = s.nazevObce ?? "";
            const zip =
                s.pscTxt ??
                (typeof s.psc === "number" ? String(s.psc).padStart(5, "0") : "");

            setValue("addressLine1", streetPart || "");
            setValue("city", city || "");
            setValue("zip", zip || "");
            setValue("countryCode", "CZ");

            const label = formatAddressDisplay(streetPart, zip, city);
            setValue("addressDisplay", label || streetPart || city || zip || "");
        }
    };

    /** ====== Načtení existujícího zákazníka ====== */

    useEffect(() => {
        if (existingCustomer) {
            const displayLabel = formatAddressDisplay(
                existingCustomer.addressLine1,
                existingCustomer.zip,
                existingCustomer.city
            );
            reset({
                name: existingCustomer.name ?? "",
                ico: existingCustomer.ico ?? "",
                dic: existingCustomer.dic ?? "",
                legalForm: existingCustomer.legalForm ?? "",
                email: existingCustomer.email ?? "",
                phone: existingCustomer.phone ?? "",
                note: existingCustomer.note ?? "",
                addressLine1: existingCustomer.addressLine1 ?? "",
                addressLine2: existingCustomer.addressLine2 ?? "",
                city: existingCustomer.city ?? "",
                zip: existingCustomer.zip ?? "",
                countryCode: existingCustomer.countryCode ?? "CZ",
                addressDisplay: displayLabel,
            });

            const nameInput = [
                existingCustomer.name?.trim(),
                existingCustomer.ico ? `(${existingCustomer.ico})` : null,
            ]
                .filter(Boolean)
                .join(" ");

            setSelectedAresOption(null);
            setAresSearchInput(nameInput);
        }
    }, [existingCustomer, reset]);

    /** ====== Submit ====== */

    const onSubmit: SubmitHandler<CustomerFormValues> = async (values) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { addressDisplay: _addressDisplay, ...payload } = values;
        try {
            if (isUpdate && id) {
                await updateCustomer({ id, data: payload }).unwrap();
            } else {
                await createCustomer(payload).unwrap();
            }
            navigate("/customers");
        } catch (e) {
            console.error("Customer save failed", e);
        }
    };

    if (isUpdate && isLoadingExisting) {
        return <div>Loading…</div>;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack direction="column" spacing={2} sx={{ flex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" fontWeight={600}>
                        {isUpdate ? "Update customer" : "New customer"}
                    </Typography>
                    <Button
                        startIcon={<ArrowBackRounded />}
                        type="button"
                        variant="outlined"
                        disableElevation
                        sx={{ textTransform: "none" }}
                        onClick={() => navigate("/customers")}
                    >
                        {"Back"}
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
                    <CardContent>
                        <Stack direction="column" spacing={2} sx={{ flex: 1 }}>
                            {/* Základní údaje */}
                            <Typography variant="subtitle1" fontWeight={800}>
                                Business identification
                            </Typography>

                            {/* Name + ICO držíme jen v RHF, neviditelné */}
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => <input type="hidden" {...field} />}
                            />
                            <Controller
                                name="ico"
                                control={control}
                                render={({ field }) => <input type="hidden" {...field} />}
                            />

                            {/* ARES search autocomplete */}
                            <Stack direction="row" spacing={2}>
                                <Grid container sx={{ flex: 1 }} spacing={2}>
                                    <Grid size={{ xs: 12, sm: 12, md: 5 }}>
                                        <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary" lineHeight={1}>
                                                Name or Company ID *
                                            </Typography>
                                            <Autocomplete<AresSearchItem, false, false, true>
                                                fullWidth
                                                freeSolo
                                                options={aresOptions}
                                                loading={isSearchingAres}
                                                value={selectedAresOption}
                                                inputValue={aresSearchInput}
                                                onInputChange={(_, value) => setAresSearchInput(value)}
                                                getOptionLabel={(option) =>
                                                    typeof option === "string"
                                                        ? option
                                                        : `${option.businessName} (${option.companyId})`
                                                }
                                                onChange={(_, value) => {
                                                    if (!value || typeof value === "string") {
                                                        setSelectedAresOption(null);
                                                        setAresSearchInput("");
                                                        setValue("name", "");
                                                        setValue("ico", "");
                                                        setValue("dic", "");
                                                        setValue("legalForm", "");
                                                        setValue("addressLine1", "");
                                                        setValue("city", "");
                                                        setValue("zip", "");
                                                        setValue("countryCode", "");
                                                        setValue("addressDisplay", "");

                                                        return;
                                                    }

                                                    const selected = value as AresSearchItem;
                                                    setSelectedAresOption(selected);

                                                    if (selected.companyId) {
                                                        setValue("ico", selected.companyId);
                                                    }
                                                    if (selected.businessName) {
                                                        setValue("name", selected.businessName);
                                                    }

                                                    if (selected.fullAddress) {
                                                        setValue("addressDisplay", selected.fullAddress);
                                                        setValue("addressLine1", selected.fullAddress);
                                                    }

                                                    (async () => {
                                                        try {
                                                            const detail = await fetchAresDetail(
                                                                selected.companyId
                                                            ).unwrap();
                                                            applyAresDetailToForm(detail);
                                                        } catch (e) {
                                                            console.error("ARES detail error", e);
                                                        }
                                                    })();
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        placeholder="Company (12345678)"
                                                        helperText={
                                                            errors.name
                                                                ? errors.name.message
                                                                : ""
                                                        }
                                                        error={!!errors.name}
                                                    />
                                                )}
                                            />
                                        </Stack>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                                        <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary" lineHeight={1}>
                                                VAT ID
                                            </Typography>
                                            <Controller
                                                name="dic"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <TextField
                                                        {...field}
                                                        placeholder="VAT Identification Number"
                                                        fullWidth
                                                        error={!!fieldState.error}
                                                        helperText={fieldState.error?.message}
                                                        InputLabelProps={{ shrink: Boolean(field.value) }}
                                                    />
                                                )}
                                            />
                                        </Stack>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 12, md: 3 }}>
                                        <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary" lineHeight={1}>
                                                Legal form
                                            </Typography>
                                            <Controller
                                                name="legalForm"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <TextField
                                                        {...field}
                                                        placeholder="Legal form Number"
                                                        sx={{ flex: 1 }}
                                                        error={!!fieldState.error}
                                                        helperText={fieldState.error?.message}
                                                        InputLabelProps={{ shrink: Boolean(field.value) }}
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
                    <CardContent>
                        <Stack direction="column" spacing={2} sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight={800}>
                                Contact details
                            </Typography>
                            <Stack direction="row" spacing={2}>
                                <Grid container sx={{ flex: 1 }} spacing={2}>
                                    <Grid size={{ xs: 12, sm: 12, md: 5 }}>
                                        <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary" lineHeight={1}>
                                                Address *
                                            </Typography>
                                            <Controller
                                                name="addressDisplay"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <TextField
                                                        {...field}
                                                        onChange={(event) => {
                                                            field.onChange(event);
                                                            setValue("addressLine1", event.target.value);
                                                        }}
                                                        placeholder="Schlosshoferstrasse 20,1210 Vienna"
                                                        error={!!fieldState.error}
                                                        helperText={fieldState.error?.message}
                                                    />
                                                )}
                                            />
                                        </Stack>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                                        <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary" lineHeight={1}>
                                                Email
                                            </Typography>
                                            <Controller
                                                name="email"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <TextField
                                                        {...field}
                                                        sx={{ flex: 1 }}
                                                        error={!!fieldState.error}
                                                        helperText={fieldState.error?.message}
                                                        placeholder="example@gmail.com"
                                                    />
                                                )}
                                            />
                                        </Stack>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 12, md: 3 }}>
                                        <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary" lineHeight={1}>
                                                Phone
                                            </Typography>
                                            <Controller
                                                name="phone"
                                                control={control}
                                                render={({ field, fieldState }) => (
                                                    <TextField
                                                        {...field}
                                                        sx={{ flex: 1 }}
                                                        error={!!fieldState.error}
                                                        helperText={fieldState.error?.message}
                                                        placeholder="+420 123 456 789"
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
                        <Stack direction="column" spacing={2} sx={{ flex: 1, height: "100%" }}>
                            <Typography variant="subtitle1" fontWeight={800}>
                                Customer note
                            </Typography>
                            {/* Poznámka */}
                            <Controller
                                name="note"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <TextField
                                        {...field}
                                        placeholder="Internal note about the customer"
                                        multiline
                                        minRows={4}
                                        error={!!fieldState.error}
                                        helperText={fieldState.error?.message}
                                    />
                                )}
                            />
                        </Stack>
                    </CardContent>
                </Card>
                <Stack direction={"row"} justifyContent={"flex-end"}>
                    <Button
                        startIcon={<PersonAddAlt1Rounded />}
                        type="submit"
                        variant="contained"
                        disableElevation
                        sx={{ textTransform: "none" }}
                        disabled={isSubmitting}
                    >
                        {isUpdate ? "Update customer" : "Create customer"}
                    </Button>
                </Stack>
            </Stack>
        </form>
    );
};

export default CustomersForm;
