# Parent Wallet & Payment Integration Guide

## Overview
This guide covers the complete parent wallet implementation, allowing parents to:
- Maintain a wallet balance
- Recharge wallet via Razorpay payment gateway
- Pay children's fees directly from wallet
- View pending fees and payment history

---

## Backend Setup

### 1. New Entities Created

#### **ParentWallet Entity**
- Stores parent wallet balance
- One-to-one relationship with Parent
- Methods: `addBalance()`, `deductBalance()`, `hasSufficientBalance()`
- Fields: id, parent, balance, createdAt, updatedAt, notes, lastTransactionId

### 2. New Repository

#### **ParentWalletRepository**
- `findByParent(Parent)` - Get wallet by parent
- `findByParentId(Long)` - Get wallet by parent ID

### 3. ParentController Enhanced

Added wallet endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/parent/wallet` | GET | Get wallet details |
| `/api/parent/wallet/balance` | GET | Get wallet balance only |
| `/api/parent/wallet/add-balance` | POST | Add balance after payment |
| `/api/parent/wallet/pay-fee` | POST | Pay fee using wallet |
| `/api/parent/wallet/pending-fees` | GET | Get all pending fees |
| `/api/parent/wallet/check-balance/{feeId}` | GET | Check if can pay fee |

### 4. Usage Examples

#### Get Wallet Balance
```bash
curl -X GET "http://localhost:8080/api/parent/wallet/balance" \
  -H "Authorization: Bearer {token}"
```

Response:
```json
{
  "status": "success",
  "data": 25000.00,
  "message": "Success"
}
```

#### Recharge Wallet (after Razorpay payment)
```bash
curl -X POST "http://localhost:8080/api/parent/wallet/add-balance" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "transactionId": "pay_xxxxx",
    "notes": "Wallet Recharge via Card"
  }'
```

Response:
```json
{
  "status": "success",
  "data": {
    "newBalance": 30000.00,
    "transactionId": "pay_xxxxx",
    "amount": 5000
  },
  "message": "Balance added successfully"
}
```

#### Pay Fee with Wallet
```bash
curl -X POST "http://localhost:8080/api/parent/wallet/pay-fee" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "childId": 1,
    "feeId": 5
  }'
```

Response:
```json
{
  "status": "success",
  "data": {
    "feeId": 5,
    "amount": 2000,
    "childName": "Student Name",
    "newBalance": 28000.00
  },
  "message": "Fee paid successfully using wallet"
}
```

#### Get Pending Fees
```bash
curl -X GET "http://localhost:8080/api/parent/wallet/pending-fees" \
  -H "Authorization: Bearer {token}"
```

Response:
```json
{
  "status": "success",
  "data": {
    "pendingFees": [
      {
        "id": 5,
        "student": {"id": 1, "name": "Student Name"},
        "amount": 2000,
        "dueDate": "2026-06-15",
        "feeType": "TUITION",
        "status": "PENDING"
      }
    ],
    "totalDue": 5000.00,
    "walletBalance": 25000.00,
    "canPayAll": true
  },
  "message": "Success"
}
```

---

## Frontend Setup

### 1. API Integration

#### **parentWallet.js** - API Module
```javascript
import {
  getParentWallet,
  getParentWalletBalance,
  addParentWalletBalance,
  payFeeWithWallet,
  getParentPendingFees,
  checkParentCanPayFee
} from '../api/parentWallet';
```

#### **ParentWalletDashboard.jsx** - Main Component
- Wallet balance display
- Recharge wallet modal with Razorpay integration
- Pending fees list with payment capability
- Real-time balance updates

### 2. Integration in Parent Dashboard

Add to parent dashboard pages:

```jsx
import { ParentWalletDashboard } from './components/ParentWalletDashboard';

export const ParentDashboard = () => {
  const [activeTab, setActiveTab] = useState('wallet');

  return (
    <div>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <button onClick={() => setActiveTab('wallet')}>
          💳 Wallet & Payments
        </button>
        <button onClick={() => setActiveTab('children')}>
          👥 Children
        </button>
      </div>

      {/* Content */}
      {activeTab === 'wallet' && <ParentWalletDashboard />}
      {activeTab === 'children' && <ChildrenSection />}
    </div>
  );
};
```

### 3. Recharge Flow

```
Parent clicks "Recharge Wallet"
  ↓
Enter amount & confirm
  ↓
Razorpay payment modal opens
  ↓
Parent completes payment
  ↓
Signature verified on backend
  ↓
Wallet balance updated
  ↓
Success message & refresh
```

### 4. Fee Payment Flow

```
Parent views pending fees
  ↓
Selects fee & clicks "Pay with Wallet"
  ↓
Confirmation modal shows balance check
  ↓
Parent confirms payment
  ↓
Fee deducted from wallet
  ↓
Fee marked as PAID in database
  ↓
Success message & refresh
```

---

## Database Schema

### Parent Wallets Table
```sql
CREATE TABLE parent_wallets (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  parent_id BIGINT UNIQUE NOT NULL,
  balance DOUBLE DEFAULT 0.0,
  last_transaction_id VARCHAR(100),
  notes VARCHAR(500),
  created_at DATETIME NOT NULL,
  updated_at DATETIME,
  FOREIGN KEY (parent_id) REFERENCES parents(id)
);
```

### Updates to Fees Table
The existing `fees` table is used with:
- `status` - PENDING, PAID, OVERDUE
- `paid_date` - Date fee was paid
- `paid_amount` - Amount paid (supports partial payments)

---

## Security Considerations

### 1. Authentication
- All wallet endpoints require `@PreAuthorize("hasRole('PARENT')")`
- Bearer token authentication via JWT

### 2. Authorization
- Parents can only access their own wallet
- Parents can only pay fees for their linked children
- Verified via `getVerifiedChild()` helper method

### 3. Payment Security
- Razorpay signature verification (HMAC-SHA256)
- Transaction ID tracking
- Idempotent balance operations

### 4. Data Validation
- Amount > 0 validation
- Balance sufficiency checks
- Fee-student-parent relationship verification

---

## Error Handling

### Common Errors & Solutions

**1. "Insufficient wallet balance"**
```
Error: "Insufficient wallet balance. Required: ₹2000, Available: ₹1500"
Solution: Parent needs to recharge wallet by ₹500+
```

**2. "Fee not found"**
```
Error: "Fee not found"
Solution: Fee ID doesn't exist or fee already paid
```

**3. "Child not linked to this parent"**
```
Error: "Child not linked to this parent"
Solution: Parent must link child first via /api/parent/children/link
```

**4. "Payment signature verification failed"**
```
Error: "Payment verified but couldn't update wallet"
Solution: Backend issue - check Razorpay credentials
```

---

## Testing

### Test Scenarios

#### 1. Wallet Recharge
```
1. Navigate to Wallet & Payments
2. Click "Recharge Wallet"
3. Enter amount (₹500)
4. Complete Razorpay payment with test card
5. Verify balance updated
```

#### 2. Pay Fee with Wallet
```
1. Recharge wallet with ₹5000
2. View Pending Fees section
3. Click "Pay with Wallet" on any fee
4. Confirm payment
5. Verify fee marked as PAID
6. Verify balance deducted
```

#### 3. Insufficient Balance
```
1. Wallet has ₹1000
2. Try to pay fee of ₹2000
3. Verify "Pay with Wallet" button disabled
4. Verify error message shown
```

---

## API Response Format

All endpoints follow this format:

```json
{
  "status": "success|error",
  "data": { /* actual data */ },
  "message": "Human-readable message"
}
```

### Success Response
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "parentId": 10,
    "balance": 25000.00,
    "lastTransaction": "pay_xxxxx",
    "createdAt": "2026-05-18T10:30:00",
    "updatedAt": "2026-05-18T14:15:00"
  },
  "message": "Success"
}
```

### Error Response
```json
{
  "status": "error",
  "data": null,
  "message": "Insufficient wallet balance. Required: ₹2000, Available: ₹1500"
}
```

---

## Features Implemented

✅ **Wallet Management**
- Create wallet on first access
- View balance
- Track transactions

✅ **Payment Gateway Integration**
- Razorpay recharge
- Signature verification
- Transaction ID tracking

✅ **Fee Payment**
- View all pending fees
- Pay individual fees
- Mark as PAID with date

✅ **Balance Checks**
- Verify sufficient balance
- Show shortfall amount
- Prevent overspending

✅ **Parent Portal UI**
- Beautiful dashboard
- Quick amount select (₹1000, ₹5000, ₹10000, ₹25000)
- Real-time balance updates
- Confirmation modals
- Error/Success messages

---

## Roadmap (Optional Features)

- [ ] Transaction history view
- [ ] Wallet statement export (PDF)
- [ ] Auto-pay setup (recurring fees)
- [ ] Wallet transfer between parents
- [ ] Refund management
- [ ] SMS/Email receipt after payment
- [ ] Wallet cashback offers
- [ ] Payment analytics

---

## Troubleshooting

### Wallet Not Appearing
**Problem:** Parent doesn't see wallet balance
**Solution:**
- Check JWT token validity
- Verify parent is logged in as ROLE_PARENT
- Check ParentWalletRepository is registered

### Payment Not Updating Balance
**Problem:** Razorpay payment completed but balance not updated
**Solution:**
- Check Razorpay credentials in application.properties
- Verify signature verification logic
- Check backend logs for errors
- Ensure transactionId is unique

### "Pay with Wallet" Button Disabled
**Problem:** Can't pay fee even with sufficient balance
**Solution:**
- Check if balance is actually >= fee amount
- Verify fee is not already paid
- Check child is properly linked to parent
- Refresh page and try again

---

## Support & Resources

- Backend Endpoints: `/api/parent/wallet/**`
- Frontend Component: `src/components/ParentWalletDashboard.jsx`
- API Module: `src/api/parentWallet.js`
- Payment API: `src/api/payment.js`
- Razorpay Docs: https://razorpay.com/docs/
- Spring Security Docs: https://spring.io/projects/spring-security
