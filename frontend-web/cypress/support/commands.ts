/* eslint-disable @typescript-eslint/no-namespace */
type AuthProfile = {
    id: number;
    email: string;
    fullName: string;
    roles: string[];
};

type AuthResult = {
    token: string;
    profile: AuthProfile;
};

const FALLBACK_TEST_TOKEN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo0MTAyNDQ0ODAwfQ.signature";

const FALLBACK_TEST_PROFILE: AuthProfile = {
    id: 1,
    email: "test@example.com",
    fullName: "Test User",
    roles: ["User"],
};

const AUTH_TOKEN_STORAGE_KEY = "auth_token";
const AUTH_PROFILE_STORAGE_KEY = "auth_profile";

const ensureLeadingSlash = (path: string) => (path.startsWith("/") ? path : `/${path}`);

const setAuthInLocalStorage = (win: Window, auth: AuthResult) => {
    win.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, auth.token);
    win.localStorage.setItem(AUTH_PROFILE_STORAGE_KEY, JSON.stringify(auth.profile));
};

declare global {
    namespace Cypress {
        interface Chainable {
            authenticatedVisit(path: string): Chainable<void>;
            ensureAuth(): Chainable<AuthResult>;
            apiRequest<T = unknown>(options: Partial<Cypress.RequestOptions>): Chainable<Cypress.Response<T>>;
        }
    }
}

const getApiUrl = () => (Cypress.env("apiUrl") as string | undefined)?.replace(/\/$/, "") ?? "";

const getUseRealApi = () => Boolean(Cypress.env("useRealApi"));

const getOrCreateE2eCredentials = () => {
    const email = (Cypress.env("e2eEmail") as string | undefined) ?? "e2e@example.com";
    const password = (Cypress.env("e2ePassword") as string | undefined) ?? "Password123!";
    const firstName = (Cypress.env("e2eFirstName") as string | undefined) ?? "E2E";
    const lastName = (Cypress.env("e2eLastName") as string | undefined) ?? "User";
    return { email, password, firstName, lastName };
};

Cypress.Commands.add("ensureAuth", () => {
    if (!getUseRealApi()) {
        return cy.wrap<AuthResult>({
            token: FALLBACK_TEST_TOKEN,
            profile: FALLBACK_TEST_PROFILE,
        });
    }

    const cached = Cypress.env("e2eAuth") as AuthResult | undefined;
    if (cached?.token) {
        return cy.wrap(cached);
    }

    const apiUrl = getApiUrl();
    if (!apiUrl) {
        throw new Error("Missing Cypress env `apiUrl`.");
    }

    const credentials = getOrCreateE2eCredentials();

    return cy
        .request({
            method: "POST",
            url: `${apiUrl}/Auth/register`,
            failOnStatusCode: false,
            body: {
                email: credentials.email,
                password: credentials.password,
                firstName: credentials.firstName,
                lastName: credentials.lastName,
            },
        })
        .then(() =>
            cy.request<AuthResult>({
                method: "POST",
                url: `${apiUrl}/Auth/login`,
                body: {
                    email: credentials.email,
                    password: credentials.password,
                },
            }),
        )
        .then((response) => {
            Cypress.env("e2eAuth", response.body);
            return response.body;
        });
});

Cypress.Commands.add("apiRequest", <T = unknown>(options: Partial<Cypress.RequestOptions>) => {
    const apiUrl = getApiUrl();
    if (!apiUrl) {
        throw new Error("Missing Cypress env `apiUrl`.");
    }

    const method = (options.method as Cypress.HttpMethod | undefined) ?? "GET";
    const url = options.url ?? options.path;
    if (!url || typeof url !== "string") {
        throw new Error("apiRequest requires `url` (string).");
    }

    const fullUrl = url.startsWith("http") ? url : `${apiUrl}${ensureLeadingSlash(url)}`;

    return cy.ensureAuth().then((auth) => {
        const headers = {
            ...(options.headers ?? {}),
            Authorization: `Bearer ${auth.token}`,
        };

        return cy.request<T>({
            ...options,
            method,
            url: fullUrl,
            headers,
        });
    });
});

Cypress.Commands.add("authenticatedVisit", (path: string) => {
    return cy.ensureAuth().then((auth) => {
        return cy.visit(path, {
            onBeforeLoad: (win) => {
                setAuthInLocalStorage(win, auth);
            },
        });
    });
});

export {};
