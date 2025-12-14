describe("Customer creation flow", () => {
    beforeEach(() => {
        cy.intercept("GET", "**/api/Customers*", { items: [], totalCount: 0 }).as("listCustomers");
    });

    it("allows creating a new customer via the form", () => {
        cy.intercept("GET", "**/api/Ares/search*", {
            body: [
                {
                    companyId: "12345678",
                    businessName: "Test Customer s.r.o.",
                    fullAddress: "Example Street 1, Prague",
                    legalForm: "s.r.o.",
                },
            ],
        }).as("searchAres");

        cy.intercept("GET", "**/api/Ares/12345678", {
            body: {
                ico: "12345678",
                obchodniJmeno: "Test Customer s.r.o.",
                pravniForma: "s.r.o.",
                dic: "CZ12345678",
                sidlo: {
                    nazevUlice: "Example Street",
                    cisloDomovni: "1",
                    nazevObce: "Prague",
                    pscTxt: "10000",
                },
            },
        }).as("aresDetail");

        cy.intercept("POST", "**/api/Customers", {
            statusCode: 201,
            body: { id: 99, name: "Test Customer s.r.o." },
        }).as("createCustomer");

        cy.authenticatedVisit("/customers/new");

        cy.get('input[placeholder="Company (12345678)"]').type("Test");
        cy.wait("@searchAres");
        cy.contains("li", "Test Customer s.r.o.").click();

        cy.get('input[placeholder="example@gmail.com"]').type("customer@example.com");

        cy.contains("button", "Create customer").click();

        cy.wait("@createCustomer")
            .its("request.body")
            .should("include", {
                name: "Test Customer s.r.o.",
                email: "customer@example.com",
            });

        cy.url().should("include", "/customers");
    });
});
