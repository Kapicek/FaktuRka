describe("Invoice creation flow", () => {
    beforeEach(() => {
        const useRealApi = Boolean(Cypress.env("useRealApi"));

        if (!useRealApi) {
            cy.intercept("GET", "**/api/Invoices*", { items: [], totalCount: 0 }).as("listInvoices");
            cy.intercept("GET", "**/api/Customers*", {
                items: [
                    {
                        id: 1,
                        name: "Acme Corp",
                        email: "acme@example.com",
                    },
                ],
                totalCount: 1,
            }).as("customersLookup");
            cy.wrap({ id: 1, name: "Acme Corp" }).as("customer");
            return;
        }

        const customerName = `Acme Corp ${Date.now()}`;

        cy.apiRequest<CustomerDto>({
            method: "POST",
            url: "/Customers",
            body: {
                name: customerName,
                email: "acme@example.com",
            },
        }).then((response) => {
            cy.wrap({ id: response.body.id, name: response.body.name }).as("customer");
        });

        cy.intercept("GET", "**/api/Invoices*").as("listInvoices");
        cy.intercept("GET", "**/api/Customers*").as("customersLookup");
    });

    it("allows issuing a new invoice", () => {
        const useRealApi = Boolean(Cypress.env("useRealApi"));

        if (!useRealApi) {
            cy.intercept("POST", "**/api/Invoices", {
                statusCode: 201,
                body: { id: 501 },
            }).as("createInvoice");
        } else {
            cy.intercept("POST", "**/api/Invoices").as("createInvoice");
        }

        cy.authenticatedVisit("/invoices/new");

        cy.get<CustomerAlias>("@customer").then((customer) => {
            cy.wait("@customersLookup")
                .its("response.body")
                .should((body) => {
                    const items = (body as { items?: Array<{ id: number; name: string }> }).items ?? [];
                    expect(items.some((item) => item.id === customer.id)).to.equal(true);
                });

            cy.get('input[placeholder="Company s. r. o."]').click().clear().type(customer.name);
            cy.contains('li[role="option"]', customer.name, { timeout: 10_000 }).click();
        });

        cy.get('input[placeholder="Item name"]').clear().type("Consulting");
        cy.get('input[name="items.0.quantity"]').clear().type("2");
        cy.get('input[name="items.0.unitPrice"]').clear().type("1500");

        cy.contains("button", "Issue invoice").click();

        cy.get<CustomerAlias>("@customer").then((customer) => {
            cy.wait("@createInvoice")
                .its("request.body")
                .should((body) => {
                    const requestBody = body as InvoiceCreateRequest;
                    expect(requestBody.customerId).to.equal(customer.id);
                    expect(requestBody.items[0].name).to.equal("Consulting");
                });
        });

        cy.url().should("include", "/invoices");
    });
});

type CustomerDto = {
    id: number;
    name: string;
};

type CustomerAlias = {
    id: number;
    name: string;
};

type InvoiceCreateRequest = {
    customerId: number;
    items: Array<{
        name: string;
    }>;
};
