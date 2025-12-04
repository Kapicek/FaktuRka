import React, { useEffect, useMemo, useState } from "react";
import {
    Stack,
    TextField,
    Button,
    Card,
    CardContent,
    useColorScheme,
    CardActions,
    Typography,
    Autocomplete,
    Grid,
} from "@mui/material";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
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

import "@geoapify/geocoder-autocomplete/styles/minimal.css";
import "../styles/geoapify-mui.css";
import {
    GeoapifyGeocoderAutocomplete,
    GeoapifyContext,
} from "@geoapify/react-geocoder-autocomplete";
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
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

const GEOAPIFY_API_KEY =
    (import.meta as any).env?.VITE_GEOAPIFY_API_KEY as string | undefined;

const CustomersForm: React.FC = () => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { id } = useParams<{ id: string }>();

    const isCreate = useMemo(() => pathname.includes("new"), [pathname]);
    const isUpdate = useMemo(
        () => pathname.includes("update") && !!id,
        [pathname, id]
    );

    const [createCustomer] = useCreateCustomerMutation();
    const [updateCustomer] = useUpdateCustomerMutation();

    const { data: existingCustomer, isLoading: isLoadingExisting } =
        useGetCustomerQuery(id!, {
            skip: !isUpdate || !id,
        });

    const {
        handleSubmit,
        register,
        setValue,
        reset,
        formState: { errors, isSubmitting },
        watch,
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
        },
    });

    const [addressDisplay, setAddressDisplay] = useState("");
    const [aresSearchInput, setAresSearchInput] = useState("");
    const [selectedAresOption, setSelectedAresOption] =
        useState<AresSearchItem | null>(null);
    const { colorScheme } = useColorScheme();

    // hodnoty pro shrink labelů
    const legalFormValue = watch("legalForm");
    const dicValue = watch("dic");

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

            if (streetPart) setValue("addressLine1", streetPart);
            if (city) setValue("city", city);
            if (zip) setValue("zip", zip);
            setValue("countryCode", "CZ");

            const cityPart = [zip, city].filter(Boolean).join(" ");
            const label = [streetPart, cityPart].filter(Boolean).join(", ");
            setAddressDisplay(label);
        }
    };

    /** ====== Geoapify – zpracování vybrané adresy ====== */

    const handleAddressSelect = (value: any) => {
        if (!value) {
            setAddressDisplay("");
            setValue("addressLine1", "");
            setValue("city", "");
            setValue("zip", "");
            return;
        }

        const props = value.properties ?? {};

        const street =
            props.street ||
            props.address_line1 ||
            "";
        const houseNumber = props.housenumber || "";
        const city =
            props.city ||
            props.town ||
            props.village ||
            "";
        const zip = props.postcode || "";
        const countryCode = props.country_code
            ? String(props.country_code).toUpperCase()
            : undefined;

        const streetPart = [street, houseNumber].filter(Boolean).join(" ");
        const cityPart = [zip, city].filter(Boolean).join(" ");
        const label = [streetPart, cityPart].filter(Boolean).join(", ");

        setAddressDisplay(label);

        setValue("addressLine1", streetPart);
        setValue("city", city);
        setValue("zip", zip);
        if (countryCode) {
            setValue("countryCode", countryCode);
        }
    };

    /** ====== Načtení existujícího zákazníka ====== */

    useEffect(() => {
        if (existingCustomer) {
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
            });

            const streetPart = existingCustomer.addressLine1 || "";
            const cityPart = [existingCustomer.zip, existingCustomer.city]
                .filter(Boolean)
                .join(" ");
            const label = [streetPart, cityPart].filter(Boolean).join(", ");
            setAddressDisplay(label);
        }
    }, [existingCustomer, reset]);

    /** ====== Submit ====== */

    const onSubmit: SubmitHandler<CustomerFormValues> = async (values) => {
        try {
            if (isUpdate && id) {
                await updateCustomer({ id, data: values }).unwrap();
            } else {
                await createCustomer(values).unwrap();
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
                        type="submit"
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
                            <input type="hidden" {...register("name")} />
                            <input type="hidden" {...register("ico")} />

                            {/* ARES search autocomplete */}
                            <Stack direction="row" spacing={2}>
                                <Grid container sx={{ flex: 1 }} spacing={2}>
                                    <Grid size={{ xs: 12, sm: 12, md: 5 }}>
                                        <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="text.secondary" lineHeight={1}>
                                                Name or Company ID
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
                                                    // 1) CLEAR – uživatel kliknul na křížek / nastala null hodnota
                                                    if (!value || typeof value === "string") {
                                                        setSelectedAresOption(null);
                                                        setAresSearchInput("");

                                                        // vyčistit hodnoty, které ARES naplnil
                                                        setValue("name", "");
                                                        setValue("ico", "");
                                                        setValue("dic", "");
                                                        setValue("legalForm", "");
                                                        setValue("addressLine1", "");
                                                        setValue("city", "");
                                                        setValue("zip", "");
                                                        setValue("countryCode", ""); // nebo "" pokud chceš úplně prázdné
                                                        setAddressDisplay("");

                                                        return;
                                                    }

                                                    // 2) SELECT – vybraná firma z ARES
                                                    const selected = value as AresSearchItem;
                                                    setSelectedAresOption(selected);

                                                    if (selected.companyId) {
                                                        setValue("ico", selected.companyId);
                                                    }
                                                    if (selected.businessName) {
                                                        setValue("name", selected.businessName);
                                                    }

                                                    if (selected.fullAddress) {
                                                        setAddressDisplay(selected.fullAddress);
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
                                            <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                VAT ID
                                            </Typography>
                                            <TextField
                                                placeholder="VAT Identification Number"
                                                fullWidth
                                                {...register("dic")}
                                                error={!!errors.dic}
                                                helperText={errors.dic?.message}
                                                InputLabelProps={{ shrink: !!dicValue }}
                                            />
                                        </Stack>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 12, md: 3 }}>
                                        <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                            <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                                Legal form
                                            </Typography>
                                            <TextField
                                                placeholder="Legal form Number"
                                                sx={{ flex: 1 }}
                                                {...register("legalForm")}
                                                error={!!errors.legalForm}
                                                helperText={errors.legalForm?.message}
                                                InputLabelProps={{ shrink: !!legalFormValue }}
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
                                <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                    <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                        Address
                                    </Typography>
                                    {GEOAPIFY_API_KEY ? (
                                        <GeoapifyContext apiKey={GEOAPIFY_API_KEY}>
                                            <GeoapifyGeocoderAutocomplete
                                                placeholder="Schlosshoferstrasse 20,1210 Vienna"
                                                type="street"
                                                lang="cs"
                                                countryCodes={["cz"]}
                                                limit={7}
                                                value={addressDisplay}
                                                placeSelect={handleAddressSelect}
                                            />
                                        </GeoapifyContext>
                                    ) : (
                                        <TextField
                                            value={addressDisplay}
                                            onChange={(e) => setAddressDisplay(e.target.value)}
                                            helperText="Missing GEOAPIFY API key"
                                        />
                                    )}
                                </Stack>
                                <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                    <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                        Email
                                    </Typography>
                                    <TextField
                                        sx={{ flex: 1 }}
                                        {...register("email")}
                                        error={!!errors.email}
                                        helperText={errors.email?.message}
                                        placeholder="example@gmail.com"
                                    />
                                </Stack>
                                <Stack direction="column" spacing={1} sx={{ flex: 1 }}>
                                    <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                        Phone
                                    </Typography>
                                    <TextField
                                        sx={{ flex: 1 }}
                                        {...register("phone")}
                                        error={!!errors.phone}
                                        helperText={errors.phone?.message}
                                        placeholder="+420 123 456 789"
                                    />
                                </Stack>
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
                            <TextField
                                placeholder="Internal note about the customer"
                                multiline
                                minRows={3}
                                {...register("note")}
                                error={!!errors.note}
                                helperText={errors.note?.message}
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
                        onClick={handleSubmit(onSubmit)}
                    >
                        {"Create customer"}
                    </Button>
                </Stack>
            </Stack>
        </form>
    );
};

export default CustomersForm;
