FaktuRka  

Webová aplikace pro vystavování a správu vydaných faktur a odběratelů, s automatickým doplněním údajů z ARES. Backend C# (.NET, EF Core), frontend React, databáze PostgreSQL. 

Funkční požadavky (FR) 

1) Autentizace a role 

FR-1: Registrace a přihlášení (e-mail + heslo, hash). 

FR-2: Role Admin / User. 

FR-3: Obnova hesla. 

2) Odběratelé 

FR-4: CRUD nad odběrateli (název, IČO, DIČ, adresa, kontakt). 

FR-5: Vyhledání v ARES podle IČO/názvu a autodoplnění údajů. 

FR-6: Validace DIČ formátem (volitelně příznak plátce DPH jako ruční pole). 

3) Produkty / položky   

FR-7: Evidence položek (název, jednotka, sazba DPH, cena bez DPH). 

FR-8: Vkládání položek do faktury. 

4) Faktury 

FR-9: Vytvoření faktury: vystavitel (profil), odběratel, položky, sazby DPH, VS, datumy (vystavení, splatnost), měna CZK. 

FR-10: Číselné řady (např. YYYY/NNNN), automatické číslování. 

FR-11: Výpočty (mezisoučty, DPH, celkem), jednotné zaokrouhlování. 

FR-12: Stavy: návrh → vydaná → uhrazená / zrušená; datum úhrady. 

FR-13: Export PDF. 

FR-14: Duplikace faktury, náhled před uložením. 

FR-15: Filtry a vyhledávání: období, stav, odběratel, po splatnosti. 

 

5) Přehledy a exporty 

FR-16: Dashboard: počty vydaných/uhrazených, suma základu/DPH, seznam po splatnosti. 

FR-17: Export CSV (faktury a položky za období). 

 

 

6) Nastavení 

FR-18: Profil vystavitele (název, IČO/DIČ, adresa, bankovní účet). 

FR-19: Integrace ARES 

Technologie a architektura 

Backend: .NET, C#, ASP.NET Core Web API, EF Core. 

Frontend: React. 

DB: PostgreSQL. 
