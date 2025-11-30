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
} from "@mui/material";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    useCreateCustomerMutation,
    useGetCustomerQuery,
    useUpdateCustomerMutation,
} from "../features/customers/customersApi";

import "@geoapify/geocoder-autocomplete/styles/minimal.css";
import "../styles/geoapify-mui.css";
import {
    GeoapifyGeocoderAutocomplete,
    GeoapifyContext,
} from "@geoapify/react-geocoder-autocomplete";
import { ArrowBackIosNewRounded } from "@mui/icons-material";

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
        getValues,
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
        },
    });

    const [addressDisplay, setAddressDisplay] = useState("");
    const { colorScheme } = useColorScheme();

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

    /** ====== Lookup podle IČO – (ARES skeleton) ====== */

    const handleIcoLookup = async () => {
        const ico = getValues("ico")?.trim();
        if (!ico || !icoRegex.test(ico)) return;

        try {
            const resp = await fetch(
                `https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`
            );
            if (!resp.ok) return;

            const data = await resp.json();
            const subj = data?.ekonomickeSubjekty?.[0];
            if (subj) {
                setValue("name", subj.obchodniJmeno ?? getValues("name"));

                const streetPart = [
                    subj.sidlo?.ulice ?? "",
                    subj.sidlo?.cisloDomovni ?? "",
                ]
                    .filter(Boolean)
                    .join(" ");

                setValue("addressLine1", streetPart || getValues("addressLine1"));
                setValue("city", subj.sidlo?.nazevObce ?? getValues("city"));
                setValue("zip", subj.sidlo?.psc ?? getValues("zip"));

                const cityPart = [subj.sidlo?.psc, subj.sidlo?.nazevObce]
                    .filter(Boolean)
                    .join(" ");
                const label = [streetPart, cityPart].filter(Boolean).join(", ");
                setAddressDisplay(label);
            }
        } catch (e) {
            console.error("ICO lookup error", e);
        }
    };

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
        <Stack direction="column" spacing={2} sx={{ flex: 1, height: "100%" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant='h5' fontWeight={600}>
                    {isUpdate ? "Update customer" : "Create customer"}
                </Typography>
                <Button
                    startIcon={<ArrowBackIosNewRounded />}
                    type="submit"
                    variant="contained"
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
                    bgcolor: colorScheme === 'light' ? "background.default" : '#1f1f1f',
                }}
            >
                <CardContent sx={{ pb: 0 }}>
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        <Stack direction="column" spacing={2} sx={{ flex: 1, height: "100%" }}>
                            {/* Základní údaje */}
                            <Typography variant="h6" fontWeight={600}>
                                General information
                            </Typography>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    fullWidth
                                    label="Name *"
                                    {...register("name")}
                                    error={!!errors.name}
                                    helperText={errors.name?.message}
                                />
                            </Stack>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="ICO"
                                    sx={{ flex: 1 }}
                                    {...register("ico")}
                                    error={!!errors.ico}
                                    helperText={errors.ico?.message}
                                    onBlur={handleIcoLookup}
                                />
                                <TextField
                                    label="DIC"
                                    sx={{ flex: 1 }}
                                    {...register("dic")}
                                    error={!!errors.dic}
                                    helperText={errors.dic?.message}
                                />
                            </Stack>

                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Legal form"
                                    sx={{ flex: 1 }}
                                    {...register("legalForm")}
                                    error={!!errors.legalForm}
                                    helperText={errors.legalForm?.message}
                                />
                                <TextField
                                    label="Email"
                                    sx={{ flex: 1 }}
                                    {...register("email")}
                                    error={!!errors.email}
                                    helperText={errors.email?.message}
                                    placeholder="example@gmail.com"
                                />
                                <TextField
                                    label="Phone"
                                    sx={{ flex: 1 }}
                                    {...register("phone")}
                                    error={!!errors.phone}
                                    helperText={errors.phone?.message}
                                />
                            </Stack>

                            {/* Adresa – Geoapify autocomplete */}
                            {GEOAPIFY_API_KEY ? (
                                <GeoapifyContext apiKey={GEOAPIFY_API_KEY}>
                                    <GeoapifyGeocoderAutocomplete
                                        placeholder="Address"
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
                                    label="Address"
                                    value={addressDisplay}
                                    onChange={(e) => setAddressDisplay(e.target.value)}
                                    helperText="Missing GEOAPIFY API key"
                                />
                            )}

                            {/* Poznámka */}
                            <TextField
                                label="Note"
                                multiline
                                minRows={6}
                                {...register("note")}
                                error={!!errors.note}
                                helperText={errors.note?.message}
                            />
                        </Stack>
                    </form>
                </CardContent>
                <CardActions sx={{ justifyContent: "end", p: 2 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        disableElevation
                        sx={{ textTransform: "none" }}
                        disabled={isSubmitting}
                        onClick={handleSubmit(onSubmit)}
                    >
                        {"Save"}
                    </Button>
                </CardActions>

            </Card>
        </Stack>

    );
};

export default CustomersForm;
