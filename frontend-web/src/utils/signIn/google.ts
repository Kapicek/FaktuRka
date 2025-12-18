type GoogleCredentialResponse = {
    credential?: string;
};

type GooglePromptNotification = {
    getNotDisplayedReason?: () => string | null;
    getSkippedReason?: () => string | null;
};

type GoogleAccounts = {
    id: {
        initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
        prompt: (callback: (notification: GooglePromptNotification) => void) => void;
    };
};

declare global {
    interface Window {
        google?: { accounts?: GoogleAccounts };
    }
}

export const getGoogleIdToken = (): Promise<string> => {
    return new Promise((resolve, reject) => {
        const google = window.google;

        if (!google?.accounts?.id) {
            reject(new Error("Google SDK was not loaded"));
            return;
        }

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
            reject(new Error("missing VITE_GOOGLE_CLIENT_ID"));
            return;
        }

        google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: GoogleCredentialResponse) => {
                if (response?.credential) {
                    resolve(response.credential);
                } else {
                    reject(new Error("Google sign-in did not return a credential"));
                }
            },
        });

        google.accounts.id.prompt((notification: GooglePromptNotification) => {
            const notDisplayedReason = notification.getNotDisplayedReason?.();
            const skippedReason = notification.getSkippedReason?.();

            if (notDisplayedReason || skippedReason) {
                reject(new Error(`Google sign-in has been canceled (${notDisplayedReason ?? skippedReason})`));
            }
        });
    });
};

