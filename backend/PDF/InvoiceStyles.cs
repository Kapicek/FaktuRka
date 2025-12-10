using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace backend.PDF
{
    static class InvoiceStyles
    {
        public static TextStyle Label =>
            TextStyle.Default.FontSize(9).FontColor(Colors.Grey.Darken2);

        public static TextStyle Value =>
            TextStyle.Default.FontSize(10);

        public static TextStyle ValueBold =>
            TextStyle.Default.FontSize(10).SemiBold();

        public static string PrimaryColor => "#15C1D8";
    }

}
