describe("Invoice creation flow", () => {
    beforeEach(() => {
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
    });

    it("allows issuing a new invoice", () => {
        cy.intercept("POST", "**/api/Invoices", {
            statusCode: 201,
            body: { id: 501 },
        }).as("createInvoice");

        cy.authenticatedVisit("/invoices/new");

        cy.wait("@customersLookup");

        cy.get('input[placeholder="Company s. r. o."]').type("Acme");
        cy.contains("li", "Acme Corp").click();

        cy.get('input[placeholder="Item name"]').clear().type("Consulting");
        cy.get('input[name="items.0.quantity"]').clear().type("2");
        cy.get('input[name="items.0.unitPrice"]').clear().type("1500");

        cy.contains("button", "Issue invoice").click();

        cy.wait("@createInvoice")
            .its("request.body")
            .should((body) => {
                expect(body.customerId).to.equal(1);
                expect(body.items[0].name).to.equal("Consulting");
            });

        cy.url().should("include", "/invoices");
    });
});
