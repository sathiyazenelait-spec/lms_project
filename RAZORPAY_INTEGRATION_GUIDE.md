# Razorpay Payment Integration Setup Guide

## Overview
This guide covers the complete Razorpay payment integration for the LMS backend and frontend, including wallet management.

---

## Backend Setup

### 1. Dependencies Added
- **razorpay-java** (v1.4.8) - Official Razorpay Java SDK
- **commons-codec** (v1.15) - For signature verification (Hex encoding)

Located in `pom.xml`

### 2. Configuration

Update `application.properties`:
```properties
# Razorpay Payment Gateway
razorpay.key=YOUR_KEY_ID          # Get from Razorpay Dashboard
razorpay.secret=YOUR_SECRET        # Get from Razorpay Dashboard
```

**To get your credentials:**
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to Settings → API Keys
3. Copy your Key ID and Secret Key
4. Update in `application.properties`

### 3. Backend Components Created

#### PaymentController (`/api/payment`)
- `POST /create-order` - Create a new payment order
- `POST /verify` - Verify payment signature
- `GET /status/{paymentId}` - Get payment status

**Example Usage:**
```bash
# Create order for ₹500
curl -X POST "http://localhost:8080/api/payment/create-order?amount=500"

# Verify payment
curl -X POST "http://localhost:8080/api/payment/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_xxx",
    "razorpay_payment_id": "pay_xxx",
    "razorpay_signature": "signature_xxx"
  }'
```

#### Wallet Entity
- Stores student wallet balance
- Methods: `addBalance()`, `deductBalance()`, `hasSufficientBalance()`
- Fields: id, student, balance, createdAt, updatedAt, notes

#### WalletService
- `getOrCreateWallet()` - Get or create wallet for student
- `getBalance()` - Get current balance
- `addBalance()` - Add funds to wallet
- `deductBalance()` - Deduct funds from wallet
- `hasSufficientBalance()` - Check if sufficient balance

#### WalletController (`/api/wallet`)
- `GET /balance/{studentId}` - Get balance
- `GET /{studentId}` - Get wallet details
- `POST /add-balance/{studentId}` - Add balance (after payment)
- `POST /deduct-balance/{studentId}` - Deduct balance (purchase)
- `GET /check-balance/{studentId}` - Check if sufficient balance

**Example Usage:**
```bash
# Get wallet balance
curl "http://localhost:8080/api/wallet/balance/1"

# Add ₹500 to wallet
curl -X POST "http://localhost:8080/api/wallet/add-balance/1?amount=500&notes=Payment+for+order+123"

# Check if student has ₹1000
curl "http://localhost:8080/api/wallet/check-balance/1?requiredAmount=1000"

# Deduct ₹500 for purchase
curl -X POST "http://localhost:8080/api/wallet/deduct-balance/1?amount=500&notes=Course+Purchase"
```

---

## Frontend Setup

### 1. Environment Variables

Create `.env` file in frontend root:
```env
REACT_APP_API_BASE=http://localhost:8080
REACT_APP_RAZORPAY_KEY_ID=YOUR_KEY_ID
```

### 2. Frontend Components Created

#### `api/payment.js`
Payment utility functions:
- `createOrder(amount)` - Create Razorpay order
- `verifyPayment(paymentData)` - Verify payment signature
- `getPaymentStatus(paymentId)` - Get payment details
- `initiatePayment(amount, name, email, onSuccess, onError)` - Complete payment flow

#### `api/wallet.js`
Wallet utility functions:
- `getWalletBalance(studentId)` - Get balance
- `getWallet(studentId)` - Get wallet details
- `addWalletBalance(studentId, amount, notes)` - Add balance
- `deductWalletBalance(studentId, amount, notes)` - Deduct balance
- `checkSufficientBalance(studentId, requiredAmount)` - Check balance

### 3. Usage in Components

**Example: Wallet Recharge Component**
```jsx
import { initiatePayment } from './api/payment';
import { addWalletBalance } from './api/wallet';

const handleRecharge = async (amount) => {
  const user = getCurrentUser(); // Get logged-in user
  
  initiatePayment(
    amount,
    user.name,
    user.email,
    async (verification) => {
      // Success callback
      const paymentId = verification.paymentId;
      const orderId = verification.orderId;
      
      // Add balance to wallet
      await addWalletBalance(user.id, amount, `Payment ${paymentId}`);
      
      alert("Wallet recharged successfully!");
    },
    (error) => {
      // Error callback
      alert(`Payment failed: ${error.message}`);
    }
  );
};
```

**Example: Course Purchase with Wallet**
```jsx
import { checkSufficientBalance, deductWalletBalance } from './api/wallet';

const handleEnrollCourse = async (courseId, coursePrice) => {
  const user = getCurrentUser();
  
  try {
    // Check if student has enough balance
    const hasBalance = await checkSufficientBalance(user.id, coursePrice);
    
    if (!hasBalance) {
      alert("Insufficient wallet balance. Please recharge.");
      return;
    }
    
    // Deduct from wallet
    await deductWalletBalance(user.id, coursePrice, `Course enrollment: ${courseId}`);
    
    // Enroll in course
    await enrollCourse(courseId);
    
    alert("Course enrolled successfully!");
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
};
```

---

## Complete Payment Flow

### 1. Student Initiates Wallet Recharge
```
Frontend: Click "Recharge Wallet" button
         ↓
Frontend: initiatePayment(500, "Student Name", "email@example.com")
         ↓
Frontend: Fetch /api/payment/create-order?amount=500
         ↓
Backend: Create Razorpay order, return order details
         ↓
Frontend: Open Razorpay payment modal
         ↓
Student: Enter payment details & pay
         ↓
```

### 2. Payment Success & Verification
```
Razorpay: Send payment response with signature
         ↓
Frontend: Call verifyPayment() with payment data
         ↓
Backend: POST /api/payment/verify - Verify signature using HMAC-SHA256
         ↓
Backend: Return verification result
         ↓
Frontend: On success, call addWalletBalance()
         ↓
Backend: Add funds to wallet in database
         ↓
Frontend: Show success message & update balance
```

### 3. Student Uses Wallet for Course Purchase
```
Frontend: Click "Enroll with Wallet"
         ↓
Frontend: checkSufficientBalance(studentId, coursePrice)
         ↓
Backend: Check if balance >= coursePrice
         ↓
Backend: Return result
         ↓
Frontend: If sufficient, deductWalletBalance()
         ↓
Backend: Deduct amount, update wallet balance
         ↓
Backend: Enroll student in course
         ↓
Frontend: Show success message
```

---

## Security Considerations

### 1. Signature Verification
- All payments must be verified using HMAC-SHA256
- Signature = HMAC-SHA256(order_id|payment_id, razorpay_secret)
- Only accept payments with valid signatures

### 2. Environment Variables
- **Never** commit actual keys to Git
- Use `.env` file (add to `.gitignore`)
- Rotate keys periodically
- Use different keys for dev/prod

### 3. API Security
- Validate all inputs on backend
- Use HTTPS in production
- Implement rate limiting on payment endpoints
- Add authentication/authorization checks

### 4. Database Security
- Store razorpay credentials in environment variables, not code
- Encrypt sensitive payment data
- Audit wallet transactions
- Implement transaction logs

---

## Testing

### Test Credentials
Razorpay provides test credentials:
1. Go to Razorpay Dashboard
2. Switch to Test Mode
3. Use provided test keys

### Test Card Details
- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date
- OTP: Any 6 digits (for test)

### Test Flow
```bash
# 1. Create order
curl -X POST "http://localhost:8080/api/payment/create-order?amount=500"

# 2. Use test card in Razorpay modal
# 3. Complete payment

# 4. Verify in backend logs
# Check if signature verified successfully
```

---

## Troubleshooting

### Issue: "Invalid Razorpay key"
**Solution:** Check `application.properties` - ensure correct key ID and secret

### Issue: "Payment signature verification failed"
**Solution:** Verify signature calculation - ensure correct HMAC algorithm and secret

### Issue: "Insufficient balance"
**Solution:** This is expected behavior - user must recharge wallet first

### Issue: "Order creation failed"
**Solution:** 
- Check Razorpay credentials
- Verify amount > 0
- Check network connectivity

### Issue: Frontend can't call backend API
**Solution:**
- Check CORS configuration
- Verify API_BASE URL in `.env`
- Check if backend is running on port 8080

---

## Production Checklist

- [ ] Update Razorpay keys to production credentials
- [ ] Remove all test keys from code
- [ ] Enable HTTPS on backend
- [ ] Set up CORS properly for production domain
- [ ] Implement transaction logging
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Test complete payment flow
- [ ] Implement webhook for additional security
- [ ] Add rate limiting to payment endpoints
- [ ] Set up database backups
- [ ] Document API endpoints for team

---

## References

- [Razorpay Java SDK](https://github.com/razorpay/razorpay-java)
- [Razorpay Checkout Documentation](https://razorpay.com/docs/payments/payments-gateway/checkout-integration/)
- [Razorpay API Reference](https://razorpay.com/docs/api/payments/)
- [Webhook Signature Verification](https://razorpay.com/docs/webhooks/payloads/payment-authorized/)

---

## Support

For issues or questions:
1. Check Razorpay Dashboard for payment status
2. Review backend logs for errors
3. Verify credentials in `application.properties`
4. Check frontend `.env` configuration
5. Contact Razorpay support if payment gateway issues
