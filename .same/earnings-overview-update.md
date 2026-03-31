# Earnings Overview Update

## Summary
Updated the Earnings Overview section to properly calculate and display earnings for each officiant based on their completed payments and marketplace script sales.

## Key Features Implemented

### 1. **Year-to-Date (YTD) Earnings**
- Calculates total earnings from the current year
- Aggregates all completed payments from ALL couples the officiant has worked with
- Adds earnings from all marketplace scripts sold
- Breaks down totals into:
  - **From Couples**: Total from completed invoice payments
  - **From Scripts**: Total from marketplace script sales

### 2. **Month-to-Date (MTD) Earnings**
- Calculates earnings for the current month only
- Shows the current month and year for context
- Breaks down into:
  - **From Couples**: Completed payments this month
  - **From Scripts**: Currently shows $0 (could be enhanced to track monthly script sales)

### 3. **Pending Payments**
- Shows total amount of pending/unpaid invoices
- Displays count of pending invoices
- Helps officiant track outstanding payments

### 4. **Per-Couple Payment Tracking**
- Each couple in the system now has their own:
  - `paymentInfo`: Total amount, deposit paid, balance, payment status
  - `paymentHistory`: Array of all payment records (completed and pending)
- When switching between couples, the payment details update automatically
- When recording a new payment, it updates both the local state and the couple's permanent record

## Data Structure

### Couple Object (Updated)
```javascript
{
  id: number,
  brideName: string,
  groomName: string,
  // ... other fields ...
  paymentInfo: {
    totalAmount: number,
    depositPaid: number,
    balance: number,
    depositDate: string,
    finalPaymentDue: string,
    paymentStatus: "unpaid" | "deposit_paid" | "paid_in_full"
  },
  paymentHistory: [
    {
      id: number,
      date: string,
      amount: number,
      type: "Deposit" | "Partial Payment" | "Final Payment",
      method: string,
      status: "completed" | "pending",
      notes?: string
    }
  ]
}
```

## Calculation Logic

### YTD from Couples
```javascript
allCouples
  .flatMap(couple => couple.paymentHistory || [])
  .filter(p => p.status === 'completed')
  .filter(p => new Date(p.date).getFullYear() === currentYear)
  .reduce((sum, p) => sum + p.amount, 0)
```

### YTD from Scripts
```javascript
myScripts.reduce((sum, script) => sum + (script.earnings || 0), 0)
```

### MTD from Couples
```javascript
allCouples
  .flatMap(couple => couple.paymentHistory || [])
  .filter(p => p.status === 'completed')
  .filter(p => {
    const paymentDate = new Date(p.date)
    return paymentDate.getMonth() === currentMonth &&
           paymentDate.getFullYear() === currentYear
  })
  .reduce((sum, p) => sum + p.amount, 0)
```

## Sample Data

### Couple 1: Sarah & David
- Total: $800
- Deposit Paid: $300 (July 15, 2024) - Completed
- Balance: $500 (Due: August 18, 2024) - Pending

### Couple 2: Emily & James
- Total: $1,200
- Deposit Paid: $600 (June 20, 2024) - Completed
- Balance: $600 (Due: September 8, 2024) - Pending

### Script Sales
- Traditional Christian Wedding Ceremony: $1,050
- Modern Non-Religious Unity Ceremony: $560
- Interfaith Wedding Script: $450

### Current Totals
- **YTD Total**: $2,960 ($900 from couples + $2,060 from scripts)
- **MTD Total**: $0 (no payments completed this month in sample data)
- **Pending**: $1,100 (2 invoices pending)

## Future Enhancements
1. Add monthly tracking for script sales
2. Add charts/graphs for earnings trends
3. Add export functionality for tax reporting
4. Add filtering by date range
5. Add comparison with previous months/years
6. Track refunds and adjustments
