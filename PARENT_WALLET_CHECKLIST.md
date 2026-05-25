# Parent Wallet Implementation Checklist

## Backend Setup ✅

### Database
- [x] ParentWallet entity created
- [x] ParentWalletRepository created
- [x] Fee entity already has payment fields (status, paidDate, paidAmount)

### Controllers & APIs
- [x] Added ParentWalletRepository to ParentController
- [x] GET `/api/parent/wallet` - Get wallet details
- [x] GET `/api/parent/wallet/balance` - Get balance only
- [x] POST `/api/parent/wallet/add-balance` - Add balance after payment
- [x] POST `/api/parent/wallet/pay-fee` - Pay fee with wallet
- [x] GET `/api/parent/wallet/pending-fees` - Get all pending fees
- [x] GET `/api/parent/wallet/check-balance/{feeId}` - Check if can pay

### Build & Deploy
- [ ] Rebuild project: `mvn clean package`
- [ ] Restart Java backend
- [ ] Test API endpoints with Postman

---

## Frontend Setup ✅

### API Integration
- [x] Created `src/api/parentWallet.js` with all utility functions
- [x] Integrated with existing payment gateway

### Components
- [x] Created `ParentWalletDashboard.jsx` component
- [x] Features:
  - Wallet balance display
  - Recharge modal with Razorpay
  - Pending fees list
  - Fee payment functionality
  - Error/Success handling

### Integration Steps
- [ ] Import `ParentWalletDashboard` in parent dashboard
- [ ] Add wallet tab to parent navigation
- [ ] Ensure `localStorage.getItem("authToken")` works for auth
- [ ] Ensure `localStorage.getItem("userName")` and `userEmail` available

---

## Razorpay Configuration ✅

### Dependencies
- [x] razorpay-java 1.4.8 in pom.xml (already added)
- [x] commons-codec for signature verification

### Configuration
- [ ] Get Razorpay API credentials from dashboard
- [ ] Update `application.properties`:
```properties
razorpay.key=YOUR_KEY_ID
razorpay.secret=YOUR_SECRET
```
- [ ] Update `.env` in frontend:
```env
REACT_APP_RAZORPAY_KEY_ID=YOUR_KEY_ID
```

---

## Testing Checklist

### Backend Testing
- [ ] Test GET `/api/parent/wallet` - returns wallet details
- [ ] Test GET `/api/parent/wallet/balance` - returns balance only
- [ ] Test POST `/api/parent/wallet/add-balance` - adds balance
- [ ] Test POST `/api/parent/wallet/pay-fee` - pays fee successfully
- [ ] Test GET `/api/parent/wallet/pending-fees` - returns pending fees
- [ ] Test error cases: insufficient balance, invalid fee ID, etc.

### Frontend Testing
- [ ] Wallet component loads without errors
- [ ] Balance displays correctly
- [ ] Recharge modal opens/closes
- [ ] Amount input validation works
- [ ] Quick select buttons work
- [ ] Razorpay payment modal opens
- [ ] Payment success updates wallet balance
- [ ] Pending fees display correctly
- [ ] "Pay with Wallet" button disabled when insufficient balance
- [ ] Fee payment confirmation works
- [ ] Error messages display properly
- [ ] Success messages display properly

### Integration Testing
- [ ] Parent logs in successfully
- [ ] Can navigate to wallet section
- [ ] Can recharge wallet via Razorpay
- [ ] Can pay fees with wallet
- [ ] Balance updates in real-time
- [ ] UI reflects changes immediately

---

## File Structure

```
Backend:
├── entity/
│   └── ParentWallet.java ✅
├── repository/
│   └── ParentWalletRepository.java ✅
├── controller/
│   └── ParentController.java (updated) ✅

Frontend:
├── api/
│   ├── parentWallet.js ✅
│   └── payment.js (existing)
├── components/
│   └── ParentWalletDashboard.jsx ✅
└── pages/
    └── Parent/index.jsx (needs integration)
```

---

## API Quick Reference

### Get Wallet
```bash
GET /api/parent/wallet
Headers: Authorization: Bearer {token}
```

### Recharge Wallet
```bash
POST /api/parent/wallet/add-balance
Body: {
  "amount": 5000,
  "transactionId": "pay_xxxxx",
  "notes": "Wallet Recharge"
}
```

### Pay Fee
```bash
POST /api/parent/wallet/pay-fee
Body: {
  "childId": 1,
  "feeId": 5
}
```

### Get Pending Fees
```bash
GET /api/parent/wallet/pending-fees
```

### Check Balance for Fee
```bash
GET /api/parent/wallet/check-balance/{feeId}
```

---

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check JWT token, ensure user is PARENT role |
| "Wallet not found" | First access creates wallet automatically |
| "Child not linked" | Parent must link child first at `/api/parent/children/link` |
| Razorpay error | Check API credentials in `application.properties` |
| Balance not updating | Check Razorpay signature verification logic |
| "Insufficient balance" | This is expected - user needs to recharge |

---

## Next Steps After Implementation

1. **Test locally** with test Razorpay credentials
2. **Deploy** to staging environment
3. **Get approval** from stakeholders
4. **Switch to production** Razorpay credentials
5. **Monitor** transaction logs and balance updates
6. **Gather feedback** from parent users
7. **Iterate** on UI/UX based on feedback

---

## Additional Features to Consider

- [ ] Transaction history
- [ ] Wallet statement export
- [ ] Recurring fee auto-pay
- [ ] Refund management
- [ ] Payment receipts (email/SMS)
- [ ] Wallet notifications
- [ ] Transaction analytics dashboard
- [ ] Multiple payment methods (UPI, NetBanking, etc.)

---

## Support

For issues or questions:
1. Check `PARENT_WALLET_GUIDE.md` for detailed docs
2. Review API response errors for specific issues
3. Check browser console for frontend errors
4. Check backend logs for server errors
5. Verify Razorpay credentials and test mode
