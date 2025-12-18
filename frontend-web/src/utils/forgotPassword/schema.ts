import { z } from "zod";

export const forgotPasswordSchema = z.object({
    email: z.string().trim().min(1, "Email is required").email("Email is not valid"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const forgotPasswordDefaultValues: ForgotPasswordFormValues = {
    email: "",
};

