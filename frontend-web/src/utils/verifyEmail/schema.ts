import { z } from "zod";

export const verifyEmailSchema = z.object({
    email: z.string().email("Invalid email"),
    code: z.string().regex(/^[0-9]{6}$/, "Code must be exactly 6 digits"),
});

export type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

export const verifyEmailDefaultValues: VerifyEmailFormValues = {
    email: "",
    code: "",
};

