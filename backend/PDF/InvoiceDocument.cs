using backend.Models.Invoices;
using backend.PDF;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

public class InvoiceDocument : IDocument
{
    private readonly InvoiceDetailDto _m;

    public InvoiceDocument(InvoiceDetailDto model)
    {
        _m = model;
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(40);
            page.DefaultTextStyle(x => x.FontSize(10));

            page.Content().Column(col =>
            {
                col.Item().Element(Header);
                col.Item().PaddingVertical(12).Element(Dates);
                col.Item().Element(PaymentPanel);
                col.Item().PaddingTop(20).Element(ItemsTable);

                if (!string.IsNullOrWhiteSpace(_m.NotePublic))
                    col.Item().PaddingTop(10).Text(_m.NotePublic);

                col.Item().PaddingTop(20).Element(Summary);
            });

            page.Footer().AlignCenter()
                .Text($"Vystavil(a): {_m.IssuerName} • Strana 1 / 1")
                .FontSize(8);
        });
    }

    // ───────────── HEADER
    private void Header(IContainer c)
    {
        c.Row(row =>
        {
            // ─────── LEFT SECTION LABEL
            row.ConstantItem(20)
               .Element(e => VerticalLabel(e, "IDENTIFIKAČNÍ ÚDAJE"));

            // ─────── CONTENT
            row.RelativeItem().Column(col =>
            {
                col.Item().Row(r =>
                {
                    // ───── DODAVATEL (LEFT)
                    r.RelativeItem().Column(c1 =>
                    {
                        c1.Item().Text("Dodavatel").Style(InvoiceStyles.Label);
                        c1.Item().Text(_m.IssuerName).Style(InvoiceStyles.ValueBold);

                        if (!string.IsNullOrWhiteSpace(_m.IssuerIco))
                            c1.Item().Text($"IČ: {_m.IssuerIco}").Style(InvoiceStyles.Value);

                        if (!string.IsNullOrWhiteSpace(_m.IssuerDic))
                            c1.Item().Text($"DIČ: {_m.IssuerDic}").Style(InvoiceStyles.Value);
                    });

                    // ───── ODBĚRATEL (RIGHT)
                    r.RelativeItem().Column(c2 =>
                    {
                        c2.Item().Text("Odběratel").Style(InvoiceStyles.Label);
                        c2.Item().Text(_m.BillingName).Style(InvoiceStyles.ValueBold);

                        if (!string.IsNullOrWhiteSpace(_m.BillingAddress1))
                            c2.Item().Text(_m.BillingAddress1).Style(InvoiceStyles.Value);

                        var city = string.Join(" ",
                            new[] { _m.BillingZip, _m.BillingCity }
                            .Where(x => !string.IsNullOrWhiteSpace(x)));

                        if (!string.IsNullOrWhiteSpace(city))
                            c2.Item().Text(city).Style(InvoiceStyles.Value);

                        if (!string.IsNullOrWhiteSpace(_m.BillingCountry))
                            c2.Item().Text(_m.BillingCountry).Style(InvoiceStyles.Value);

                        if (!string.IsNullOrWhiteSpace(_m.BillingIco))
                            c2.Item().Text($"IČ: {_m.BillingIco}").Style(InvoiceStyles.Value);

                        if (!string.IsNullOrWhiteSpace(_m.BillingDic))
                            c2.Item().Text($"DIČ: {_m.BillingDic}").Style(InvoiceStyles.Value);
                    });

                    // ───── FAKTURA ČÍSLO
                    r.ConstantItem(140).AlignTop().Column(c3 =>
                    {
                        c3.Item().AlignRight().Text("FAKTURA").Bold().FontSize(16);
                        c3.Item().PaddingTop(4)
                            .Border(1)
                            .Padding(6)
                            .AlignCenter()
                            .Text(_m.NumberFull)
                            .SemiBold();
                    });
                });
            });
        });
    }


    // ───────────── DATES
    private void Dates(IContainer c)
    {
        c.PaddingTop(12).Row(row =>
        {
            row.RelativeItem()
               .Text($"Datum vystavení: {_m.IssueDate:dd.MM.yyyy}")
               .SemiBold();

            row.RelativeItem()
               .Text($"Datum splatnosti: {_m.DueDate:dd.MM.yyyy}")
               .SemiBold();
        });
    }


    // ───────────── PAYMENT PANEL (bez účtu – zatím)
    private void PaymentPanel(IContainer c)
    {
        c.PaddingTop(10).Row(row =>
        {
            row.ConstantItem(20)
                .Element(e => VerticalLabel(e, "PLATEBNÍ ÚDAJE"));

            row.RelativeItem()
               .Background(InvoiceStyles.PrimaryColor)
               .Padding(14)
               .Row(r =>
               {
                   r.RelativeItem().Text($"Variabilní symbol: {_m.VariableSymbol}")
                       .FontColor(Colors.White)
                       .SemiBold();

                   r.RelativeItem().AlignRight()
                       .Text($"K úhradě: {_m.Total:N2} {_m.Currency}")
                       .FontColor(Colors.White)
                       .FontSize(13)
                       .Bold();
               });
        });
    }

    // ───────────── ITEMS TABLE
    private void ItemsTable(IContainer c)
    {
        c.PaddingTop(20).Row(row =>
        {
            row.ConstantItem(20)
                .Element(e => VerticalLabel(e, "FAKTURUJEME"));

            row.RelativeItem().Table(t =>
            {
                t.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(4);
                    cols.RelativeColumn(1);
                    cols.RelativeColumn(2);
                    cols.RelativeColumn(2);
                });

                t.Header(h =>
                {
                    h.Cell().Text("Označení dodávky").Bold();
                    h.Cell().AlignRight().Text("Počet m.j.").Bold();
                    h.Cell().AlignRight().Text("Cena za mj.").Bold();
                    h.Cell().AlignRight().Text("Celkem").Bold();
                });

                foreach (var i in _m.Items)
                {
                    t.Cell().Text(i.Name);
                    t.Cell().AlignRight().Text(i.Quantity.ToString("0.##"));
                    t.Cell().AlignRight().Text($"{i.UnitPrice:N2} {_m.Currency}");
                    t.Cell().AlignRight().Text($"{i.LineTotal:N2} {_m.Currency}");
                }
            });
        });
    }


    // ───────────── SUMMARY
    private void Summary(IContainer c)
    {
        c.PaddingTop(20).Row(row =>
        {
            row.ConstantItem(20)
                .Element(e => VerticalLabel(e, "REKAPITULACE"));

            row.RelativeItem().AlignRight()
                .Background(InvoiceStyles.PrimaryColor)
                .Padding(14)
                .Text($"Celkem k úhradě: {_m.Total:N2} {_m.Currency}")
                .FontSize(14)
                .Bold()
                .FontColor(Colors.White);
        });
    }


    private void VerticalLabel(IContainer c, string text)
    {
        c.PaddingRight(8)
         .AlignMiddle()
         .RotateLeft()
         .Text(text)
         .FontSize(9)
         .SemiBold()
         .FontColor(InvoiceStyles.PrimaryColor);
    }

}
