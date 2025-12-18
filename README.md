FaktuRka

Webová aplikace pro vystavování a správu vydaných faktur a odběratelů, s automatickým doplněním údajů z ARES. Backend C# (.NET, EF Core), frontend React, databáze PostgreSQL.





Informace:



Swagger běží na portu 7010 -> https://localhost:7010/swagger/index.html


### E2E testy

- Reálné E2E (BE + DB v Dockeru):
  - použije se `docker-compose.e2e.yml` a Cypress poběží s `useRealApi=true`
  - pokud FE neběží, script ho automaticky spustí na `http://localhost:5173`
- Jen “mock” běh Cypress bez Dockeru: `npm run cypress:run:mock`

- `frontend-web/cypress/e2e/createCustomer.cy.ts`: otevře formulář nového zákazníka, “předstírá” ARES výsledky (search + detail), vybere firmu, doplní email a uloží zákazníka do reálné DB přes backend; ověřuje, že se poslal správný request a že aplikace přesměruje na seznam zákazníků.
- `frontend-web/cypress/e2e/createInvoice.cy.ts`: nejdřív si přes backend API vytvoří zákazníka (aby šel vybrat v UI), otevře formulář nové faktury, vybere zákazníka, vyplní položku a odešle; ověřuje `customerId` a položky v requestu a přesměrování na seznam faktur.

Pozn.: ARES je v testech záměrně mocknutý, aby testy nebyly závislé na externí službě.
