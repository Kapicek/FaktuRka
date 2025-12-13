import React from "react";
import {
    Alert,
    Avatar,
    Button,
    Chip,
    Paper,
    Stack,
    Switch,
    TextField,
    Typography,
    Grid,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetMyProfileQuery, useUpdateProfileMutation } from "../features/profile/profileApi";
import type { UserProfile } from "../features/auth/authApi";

const profileSchema = z.object({
    fullName: z.string().trim().min(1, "Full name is required"),
    email: z.string().trim().min(1, "Email is required").email("Invalid email"),
    companyName: z.string().trim().optional().or(z.literal("")),
    ico: z.string().trim().optional().or(z.literal("")),
    dic: z.string().trim().optional().or(z.literal("")),
    vatPayer: z.boolean(),
    avatarUrl: z.string().trim().optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const profileToFormValues = (data?: UserProfile | null): ProfileFormValues => ({
    fullName: data?.fullName ?? "",
    email: data?.email ?? "",
    companyName: data?.companyName ?? "",
    ico: data?.ico ?? "",
    dic: data?.dic ?? "",
    vatPayer: Boolean(data?.vatPayer),
    avatarUrl: data?.avatarUrl ?? "",
});

const Profile: React.FC = () => {
    const { data: profile, isLoading, isFetching, error } = useGetMyProfileQuery();
    const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();
    const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: profileToFormValues(),
    });

    React.useEffect(() => {
        if (profile) {
            reset(profileToFormValues(profile));
        }
    }, [profile, reset]);

    const onSubmit = async (values: ProfileFormValues) => {
        try {
            setFeedback(null);
            await updateProfile(values).unwrap();
            setFeedback({ type: "success", message: "Profile updated" });
        } catch (err) {
            console.error(err);
            setFeedback({ type: "error", message: "Failed to update profile" });
        }
    };

    const handleReset = () => {
        if (profile) {
            reset(profileToFormValues(profile));
        }
    };

    return (
        <Stack spacing={3} sx={{ flex: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" fontWeight={600}>
                    Profile
                </Typography>
                {profile?.roles && profile.roles.length > 0 && (
                    <Stack direction="row" spacing={1}>
                        {profile.roles.map((role) => (
                            <Chip key={role} label={role} color="primary" variant="outlined" />
                        ))}
                    </Stack>
                )}
            </Stack>

            {error && <Alert severity="error">Failed to load profile</Alert>}
            {feedback && <Alert severity={feedback.type}>{feedback.message}</Alert>}

            <Paper component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 3, maxWidth: 900 }}>
                <Stack spacing={3}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar src={profile?.avatarUrl ?? undefined} sx={{ width: 80, height: 80 }}>
                            {profile?.fullName?.[0]?.toUpperCase() ?? profile?.email?.[0]?.toUpperCase() ?? "U"}
                        </Avatar>
                        <Typography color="text.secondary">Manage the information associated with your account.</Typography>
                    </Stack>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 12 }}>
                            <Stack direction="column" spacing={1}>
                                <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                    Full name *
                                </Typography>
                                <Controller
                                    name="fullName"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            placeholder="John Doe"
                                            error={!!errors.fullName}
                                            helperText={errors.fullName?.message}
                                            fullWidth
                                        />
                                    )}
                                />
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Stack direction="column" spacing={1}>
                                <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                    Email *
                                </Typography>
                                <Controller
                                    name="email"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            type="email"
                                            placeholder="name@example.com"
                                            error={!!errors.email}
                                            helperText={errors.email?.message}
                                            fullWidth
                                        />
                                    )}
                                />
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Stack direction="column" spacing={1}>
                                <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                    Company name
                                </Typography>
                                <Controller
                                    name="companyName"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            placeholder="Company s.r.o."
                                            fullWidth
                                        />
                                    )}
                                />
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Stack direction="column" spacing={1}>
                                <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                    Company ID
                                </Typography>
                                <Controller
                                    name="ico"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} placeholder="00000000" fullWidth />
                                    )}
                                />
                            </Stack>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Stack direction="column" spacing={1}>
                                <Typography variant="body2" color="textSecondary" lineHeight={1}>
                                    VAT ID
                                </Typography>
                                <Controller
                                    name="dic"
                                    control={control}
                                    render={({ field }) => (
                                        <TextField {...field} placeholder="CZ00000000" fullWidth />
                                    )}
                                />
                            </Stack>
                        </Grid>
                    </Grid>

                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Typography variant="body2" color="textSecondary">
                            VAT payer
                        </Typography>
                        <Controller
                            name="vatPayer"
                            control={control}
                            render={({ field }) => <Switch {...field} checked={field.value} />}
                        />
                    </Stack>

                    <Stack direction="row" justifyContent="flex-end" spacing={2}>
                        <Button
                            type="button"
                            variant="outlined"
                            onClick={handleReset}
                            disabled={isLoading || isFetching || isSaving || !profile}
                        >
                            Reset
                        </Button>
                        <Button type="submit" variant="contained" disabled={isLoading || isSaving || !profile}>
                            {isSaving ? "Saving..." : "Save changes"}
                        </Button>
                    </Stack>
                </Stack>
            </Paper>
        </Stack>
    );
};

export default Profile;
