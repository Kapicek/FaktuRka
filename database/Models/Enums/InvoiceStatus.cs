using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace database.Models.Enums
{
    public enum InvoiceStatus { 
        Draft = 0, 
        Issued = 1, 
        Sent = 2, 
        Overdue = 3, 
        Paid = 4, 
        Cancelled = 5 
    }
}
