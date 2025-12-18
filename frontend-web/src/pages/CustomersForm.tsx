import React, { useEffect, useState } from "react";
import {
    Stack,
    TextField,
    Button,
    Typography,
    Autocomplete,
    Grid,
} from "@mui/material";
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
import { FormCard } from "../components/forms/FormCard";
import { FormField } from "../components/forms/FormField";
import {
    customerDefaultValues,
    customerSchema,
    type CustomerFormValues,
    formatAddressDisplay,
} from "./customersFormSchema";

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
        defaultValues: customerDefaultValues,
    });

    const [aresSearchInput, setAresSearchInput] = useState("");
    const [selectedAresOption, setSelectedAresOption] =
        useState<AresSearchItem | null>(null);

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
                <FormCard title="Business identification">
                    {/* Name + ICO držíme jen v RHF, neviditelné */}
                    <Controller name="name" control={control} render={({ field }) => <input type="hidden" {...field} />} />
                    <Controller name="ico" control={control} render={({ field }) => <input type="hidden" {...field} />} />

                    <Stack direction="row" spacing={2}>
                        <Grid container sx={{ flex: 1 }} spacing={2}>
                            <Grid size={{ xs: 12, sm: 12, md: 5 }}>
                                <FormField label="Name or Company ID *">
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
                                                helperText={errors.name ? errors.name.message : ""}
                                                error={!!errors.name}
                                            />
                                        )}
                                    />
                                </FormField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                                <FormField label="VAT ID">
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
                                </FormField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 12, md: 3 }}>
                                <FormField label="Legal form">
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
                                </FormField>
                            </Grid>
                        </Grid>
                    </Stack>
                </FormCard>

                <FormCard title="Contact details">
                    <Stack direction="row" spacing={2}>
                        <Grid container sx={{ flex: 1 }} spacing={2}>
                            <Grid size={{ xs: 12, sm: 12, md: 5 }}>
                                <FormField label="Address *">
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
                                </FormField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                                <FormField label="Email">
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
                                </FormField>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 12, md: 3 }}>
                                <FormField label="Phone">
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
                                </FormField>
                            </Grid>
                        </Grid>
                    </Stack>
                </FormCard>

                <FormCard title="Customer note" contentProps={{ sx: { pb: 0 } }}>
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
                </FormCard>
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
