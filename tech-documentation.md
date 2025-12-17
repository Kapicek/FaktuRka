# Fakturka – technická dokumentace (backend + database)

## Obsah
1. [Přehled](#přehled)
2. [Technologie a závislosti](#technologie-a-závislosti)
3. [Vrstvy a architektura](#vrstvy-a-architektura)
4. [Konfigurace a spuštění](#konfigurace-a-spuštění)
5. [Bezpečnost](#bezpečnost)
6. [REST API](#rest-api)
7. [Služby a byznys logika](#služby-a-byznys-logika)
8. [Repozitáře a přístup k datům](#repozitáře-a-přístup-k-datům)
9. [Databáze](#databáze)
10. [Integrace a exporty](#integrace-a-exporty)
11. [Chybové stavy a validace](#chybové-stavy-a-validace)
12. [Testování](#testování)

---

## Přehled

Projekt se skládá ze dvou .NET projektů a jednoho frontendového balíku:

- **`backend`** – ASP.NET Core Web API (REST), autentizace JWT, služby, kontrolery, PDF export faktur.
- **`database`** – knihovna s **EF Core modely** (entity + enumy) sdílená s backendem.
- **`frontend-web`** – React 19 aplikace stavěná přes **Vite**, TypeScript + MUI, data načítá přes RTK Query a komunikuje s REST API z backendu.

Aplikace je multitenantní na úrovni uživatele: téměř všechny dotazy filtrují data podle `UserId` (z JWT tokenu). V praxi to znamená: **uživatel vidí a spravuje pouze svoje zákazníky a faktury**.

---

## Technologie a závislosti

### Backend (`backend`, .NET 9)
- **ASP.NET Core Web API** (`Microsoft.NET.Sdk.Web`)
- **Entity Framework Core 9** + **Npgsql** (PostgreSQL)
- **JWT Bearer Auth** (`Microsoft.AspNetCore.Authentication.JwtBearer`)
- **Google login** (`Google.Apis.Auth`)
- **OpenAPI / Swagger** (`Swashbuckle.AspNetCore` + `Microsoft.AspNetCore.OpenApi`)
- **QuestPDF** – generování PDF faktur

### Database (`database`, .NET 9)
- **EF Core 9** + **Npgsql**
- Obsahuje entity + enumy používané i v backendu (`database.Models.*`, `database.Models.Enums.*`)

### Frontend (`frontend-web`, React + Vite)
- **React 19 + TypeScript** (`vite`, `@vitejs/plugin-react`)
- **MUI 7** pro UI komponenty, **@mui/x-data-grid / x-date-pickers** pro tabulky a datumy
- **Redux Toolkit + RTK Query** (`@reduxjs/toolkit`, `react-redux`) pro stav a REST data
- **react-hook-form + zod** pro validace formulářů
- Další knihovny: `dayjs` (datumy), `highcharts` (grafy), `cypress` (E2E)

Spuštění FE:
```bash
cd frontend-web
npm install
npm run dev         # vývoj
npm run build       # produkční build (tsc -b + vite build)
npm run lint        # eslint 9
# E2E testy (Cypress) – otevře runner nebo pustí headless běh
npm run cypress:open
npm run cypress:run
```

---

## Testování

- **Frontend** – end-to-end scénáře přes **Cypress** (viz `frontend-web/cypress/e2e/createCustomer.cy.ts`, `createInvoice.cy.ts`). Testují hlavní happy path: přihlášení, vytvoření zákazníka a faktury. Spuštění: `npm run cypress:open` pro interaktivní runner nebo `npm run cypress:run` pro headless CI.

---

## Vrstvy a architektura

Aplikace používá klasický vrstvený model:

```text
Controller (HTTP)  ->  Service (byznys)  ->  Repository (EF dotazy)  ->  DB (PostgreSQL)
                       ^                 ->  Integrace (ARES, SMTP, PDF)
                       |
                    DTO / Request modely
```

- **Controller**: validace vstupů na úrovni HTTP (základní), autorizace přes atributy `[Authorize]`.
- **Service**: hlavní byznys logika (kontroly, mapování do DTO, výpočty položek faktury, generování čísel faktur).
- **Repository**: EF Core dotazy + uložení (většina dotazů filtruje `UserId` a `DeletedAt == null`).
- **Database**: entity, indexy, vazby, precision pro decimal.

---

## Konfigurace a spuštění

### Konfigurace (appsettings / environment)
Backend očekává minimálně:

- `ConnectionStrings:Default` – připojení na PostgreSQL
- `Jwt:Key`, `Jwt:Issuer`, `Jwt:Audience`, `Jwt:AccessTokenLifetimeMinutes`
- `GoogleAuth:ClientId` – clientId pro ověření Google `idToken`
- `Smtp:*` – SMTP konfigurace pro odesílání emailů (reset hesla)

> Poznámka: konkrétní `appsettings.json` tady není, takže ty klíče musí být správně v konfiguraci. Bez toho to padá (a správně).

### Spuštění backendu
- vývoj: `dotnet run` ve složce `backend`
- Swagger (jen Development): `/swagger` (resp. SwaggerUI)

### CORS
V `Program.cs` je povolený CORS pouze pro explicitní origins (localhost porty).

---

## Bezpečnost

### Autentizace (JWT)
- Backend používá **JWT Bearer**.
- Token se posílá v hlavičce: `Authorization: Bearer <token>`.
- Validace tokenu: issuer, audience, lifetime, podpis (symetrický klíč `Jwt:Key`).
- Role se mapují z claimů typu `ClaimTypes.Role` (`RoleClaimType = ClaimTypes.Role`).

### Identita uživatele
- `ClaimsPrincipalExtensions.GetUserId()` čte `ClaimTypes.NameIdentifier` nebo `sub` a parsuje na `int`.
- `sub` je při generování tokenu nastavován na `user.Id.ToString()`.

> Pokud token nemá `sub`, backend vyhodí `InvalidOperationException` a request skončí 500.

### Autorizace (role)
- Endpoints pod `api/admin/users` jsou chráněné `[Authorize(Roles = "Admin")]`.
- Běžné API je chráněno `[Authorize]` (vyžaduje přihlášení).

---

## REST API

> Zde je praktický přehled podle controllerů. Detailní schémata request/response jsou v Swaggeru.

### Auth (`/api/auth`)
- `POST /api/auth/google`
  - přihlášení přes Google `idToken` → vrací JWT + profil
- `POST /api/auth/register`
  - registrace email/heslo
- `POST /api/auth/login`
  - login email/heslo
- `POST /api/auth/forgot-password`
  - reset hesla: pokud email existuje, pošle nové heslo (SMTP)

**Výstup:** `AuthResultDto` obsahuje `Token`, `ExpiresAt`, `Profile`.

### Profile (`/api/profile`)
- `GET /api/profile/me`
  - profil aktuálně přihlášeného uživatele
- `GET /api/profile/{userId}` (Admin)
  - profil uživatele podle ID
- `PUT /api/profile`
  - aktualizace profilu (u Google účtů je část polí záměrně „readonly“)

### Customers (`/api/customers`)
- `GET /api/customers`
  - stránkovaný výpis s filtrováním a sortem (`CustomerListQuery`)
- `GET /api/customers/{id}`
- `POST /api/customers`
- `PUT /api/customers/{id}`
- `DELETE /api/customers/{id}` (soft-delete)

### Invoices (`/api/invoices`)
- `GET /api/invoices`
  - stránkovaný výpis s filtrováním a sortem (`InvoiceListQuery`)
- `GET /api/invoices/{id}`
- `POST /api/invoices`
  - vytvoření faktury z requestu + výpočet položek + generování čísla
- `PUT /api/invoices/{id}`
  - editace jen pro `Draft`
- `DELETE /api/invoices/{id}`
  - mazání jen pro `Draft` (soft-delete)
- `POST /api/invoices/{id}/export`
  - vrátí URL na stažení PDF
- `GET /api/invoices/{id}/export-file`
  - vrátí soubor PDF (`FileContentResult`)

### ARES (`/api/ares`)
- `GET /api/ares/{ico}`
  - validuje IČO (8 číslic), volá ARES, vrací `AresSubjectDto` nebo 404
- `GET /api/ares/search?query=...&limit=...`
  - hledání podle názvu

### Admin Users (`/api/admin/users`)
- `GET /api/admin/users/roles`
  - seznam rolí (pro FE dropdown)
- `PUT /api/admin/users/{userId}/roles`
  - nastaví role uživateli (přepíše všechny existující)

---

## Služby a byznys logika

### `AuthService`
Řeší:
- Google login (validace `idToken` proti Google API)
- lokální registraci a login
- reset hesla

**Hashování hesel**
- PBKDF2 (`Rfc2898DeriveBytes`) + HMAC-SHA256
- 100 000 iterací, 16B salt, 32B key
- ukládá se Base64 hash + Base64 salt

**JWT generování**
- claims: `sub`, `email`, `name`, `provider` + role claimy
- expirace: `Jwt:AccessTokenLifetimeMinutes`
- podpis: HMAC SHA256 se symetrickým klíčem

### `UserService`
- načte profil, mapuje `User` → `UserProfileDto`
- update profilu:
  - pokud je čistě Google účet (`AuthProvider == "Google"`), některá pole se neupravují (email/jméno/avatar)

### `UserAdminService`
- vrací seznam rolí
- nastaví role uživateli „natvrdo“: nejdřív `Clear()`, pak se přidají nové `UserRole` vazby

### `CustomerService`
- stránkování + filtry + sort nad `Customer`
- validace:
  - `Name` povinné
  - `Ico` unikátní pro daného uživatele
  - `CountryCode` max 2 znaky
- create/update mapuje adresu (vytvoří novou nebo aktualizuje existující)
- delete je **soft delete** (`DeletedAt`)

### `InvoiceService`
Klíčový modul: faktury + výpočet částek + export.

- **List**: filtry (číslo, zákazník, měna, datumy, částky, status), sorty, paging.
- **Create**:
  1) validace položek a datumů
  2) načtení zákazníka a uživatele
  3) vyřešení číselné řady (`InvoiceSequence`):
     - pokud není zadaná, vezme default
     - pokud user nemá žádnou, vytvoří default
  4) vygeneruje `NumberFull` (prefix + `NextNumber:00000`)
  5) vytvoří fakturu se snapshotem odběratele a vystavovatele
  6) spočítá položky a totály (`ComputeItemsAndTotals`)
  7) uloží a posune `sequence.NextNumber++`

- **Update**:
  - dovoleno pouze pro `Draft`
  - přepíše header (data, měna, tax mode, payment method, poznámky)
  - při změně zákazníka aktualizuje snapshot billing údajů
  - smaže a znovu vytvoří položky (pozor na auditabilitu)

- **Delete**:
  - dovoleno pouze pro `Draft`
  - soft delete

**Výpočet položek a daní**
- `TaxMode`:
  - `VatExcluded`: DPH se dopočítá a přičte
  - `VatIncluded`: z ceny se „vytáhne“ základ a DPH
  - `None`: DPH = 0
- sleva je hlídaná, aby nebyla > základ řádku

---

## Repozitáře a přístup k datům

Repozitáře jsou EF Core implementace, typicky s:
- filtrem `UserId == userId`
- filtrem `DeletedAt == null` (soft delete)
- `Include` pro navigace, kde to dává smysl

### `CustomerRepository`
- `Query(userId)` vrací `AsNoTracking()` + `Include(Address)`
- `GetByIdAsync` vrací `Customer` + `Address`
- `GetByIcoAsync` na kontrolu unikátnosti
- `GetAllAsync` navíc nabízí fulltextový search (name/ico/email)

### `InvoiceRepository`
- `Query(userId)` je `AsNoTracking()`
- `GetByIdAsync` načítá `Items` + `Customer.Address`
- `GetListAsync` dělá filtrování přes `Include(Customer)` (pozor: v kódu existují dvě cesty – Query + GetListAsync)

### `InvoiceSequenceRepository`
- `GetDefaultAsync(userId)` a `GetByIdAsync`
- jednoduché add + save

### `UserRepository`
- `UsersWithRoles` vždy includuje `UserRoles.Role` (kvůli role claimům v JWT)
- vyhledávání podle `GoogleId`, `Email`, `Id`
- `AddAsync` rovnou ukládá `SaveChanges`

---

## Databáze

### Přehled entit
- `User`, `Role`, `UserRole` (M:N)
- `Customer` (N:1 k User, volitelná `Address`)
- `Invoice` (N:1 k User, N:1 k Customer, volitelná `InvoiceSequence`)
- `InvoiceItem` (N:1 k Invoice)
- `Payment` (N:1 k Invoice)
- `InvoiceSequence` (N:1 k User)

### Indexy a omezení
- `User`: unikátní `GoogleId`, unikátní `Email`
- `Customer`: unikátní `(UserId, Ico)` (pokud je `Ico` vyplněné)
- `Invoice`: unikátní `(UserId, NumberFull)`
- `Invoice`: index `(UserId, CustomerId, Status, IssueDate)` pro listy
- `Payment`: index `(InvoiceId, ReceivedAt)`
- `InvoiceSequence`: unikátní `(UserId, Name)`

### Soft delete
Entity `User`, `Customer`, `Invoice` mají `DeletedAt`. Repozitáře to filtrují manuálně.  

### Peníze (decimal precision)
- částky jsou typicky `[Precision(14,2)]` a kvantita `[Precision(12,3)]`

### Enumy (sdílené)
- `TaxMode`: `None`, `VatIncluded`, `VatExcluded`
- `PaymentMethod`: `BankTransfer`, `Cash`, `Card`, `Other`
- `InvoiceStatus`: `Draft`, `Issued`, `Sent`, `Overdue`, `Paid`, `Cancelled`

---

## Integrace a exporty

### ARES
`AresService` volá veřejné REST API ARES:
- `GET /{ico}` pro detail subjektu
- `POST /vyhledat` pro hledání podle názvu

Chování:
- 404 → vrací `null` (controller vrátí 404)
- 400 → vyhodí `ArgumentException` s tělem odpovědi
- při „příliš mnoho výsledků“ (`subKod` = `VYSTUP_PRILIS_MNOHO_VYSLEDKU`) vrací prázdný seznam

### SMTP emaily
`EmailService` posílá plain text email přes `SmtpClient`:
- reset hesla v `AuthService.ForgotPasswordAsync`

### PDF export faktury
`InvoiceService.GetInvoiceExportAsync`:
- načte fakturu
- mapuje na `InvoiceDetailDto`
- vytvoří `InvoiceDocument` (QuestPDF) a vygeneruje PDF bytes
- endpoint vrací buď odkaz (`/export`) nebo samotný soubor (`/export-file`)

---

## Chybové stavy a validace

V controllerách je kombinace:
- ruční validace (`if (...) return BadRequest(...)`)
- try/catch v service voláních (mapování výjimek na 400/401/409)

Typické mapování:
- `ArgumentException` → 400 Bad Request
- `InvalidOperationException` → 400 nebo 409 (dle controlleru)
- `UnauthorizedAccessException` → 401
- `KeyNotFoundException` → 404

---
