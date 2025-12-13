const TEST_TOKEN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiZXhwIjo0MTAyNDQ0ODAwfQ.signature";

const TEST_PROFILE = {
    id: 1,
    email: "test@example.com",
    fullName: "Test User",
    roles: ["User"],
};

declare global {
    namespace Cypress {
        interface Chainable {
            authenticatedVisit(path: string): Chainable<void>;
        }
    }
}

Cypress.Commands.add("authenticatedVisit", (path: string) => {
    cy.visit(path, {
        onBeforeLoad: (win) => {
            win.localStorage.setItem("auth_token", TEST_TOKEN);
            win.localStorage.setItem("auth_profile", JSON.stringify(TEST_PROFILE));
        },
    });
});

export {};
