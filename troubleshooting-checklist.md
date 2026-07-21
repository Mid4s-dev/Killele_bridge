# IntaSend Payment Troubleshooting Checklist

## STK Push Failures

### 1. Phone Number Format Issues
- ✅ **Fixed**: Phone formatting converts `0723335139` → `254723335139`
- Check logs for: `Initiating STK push for user X to phone 254XXXXXXXXX`
- Common issue: Leading zeros not removed, country code missing

### 2. IntaSend API Errors
```bash
heroku logs --tail --app kilele | grep "IntaSend"
```
**Look for:**
- `502 Bad Gateway`: IntaSend API unavailable
- `401 Unauthorized`: Invalid API credentials
- `400 Bad Request`: Invalid phone number or amount

### 3. Environment Variables
```bash
heroku config --app kilele | grep INTASEND
```
**Verify:**
- `INTASEND_PUBLISHABLE_KEY`: Starts with `ISPubKey_live_` (production)
- `INTASEND_SECRET_KEY`: Starts with `ISSecretKey_live_` (production) 
- `INTASEND_TEST_MODE`: `false` for production
- `REGISTRATION_FEE_KES`: Set to `500`

## Webhook Failures

### 1. Signature Verification (400 Bad Request)
```bash
heroku logs --app kilele | grep "webhook\|signature"
```
**Common Issues:**
- Missing `X-IntaSend-Signature` header
- Incorrect `PAYMENT_WEBHOOK_SECRET` 
- Raw body corruption (encoding issues)

**Current Webhook Secret:**
```
PAYMENT_WEBHOOK_SECRET=kb_sec_9a8f3e2c1b7d6e4f0a5c8b3e2d1f9a4c7e6b5a3d2f1c8e9b4a7d6c3f2e1a5b8
```

### 2. IntaSend Dashboard Configuration
**Webhook URL:** `https://kilele.mid4s.site/api/v1/payments/webhook`

**Required Settings:**
- Events: `COMPLETE`, `FAILED`, `CANCELLED`
- Method: `POST`
- Content-Type: `application/json`

### 3. Database Issues
```bash
heroku logs --app kilele | grep "payment.*not found\|user.*not found"
```
**Check:**
- Payment record exists with matching `invoice_id`
- User record exists and has correct role
- Database connection is healthy

## Frontend Polling Issues

### 1. 500 Errors on Status Polling
```bash
heroku logs --app kilele | grep "payments/status"
```
**Fixed Issues:**
- ✅ Schema mismatch: `PaymentStatusResponse.payment_id` now aliases `Payment.id`
- ✅ Field validation errors resolved

### 2. Authentication Failures
```bash
heroku logs --app kilele | grep "Not authenticated"
```
**Check:**
- JWT token validity
- User session expiration
- Authorization header format: `Bearer <token>`

## Testing Commands

### Test STK Push Directly
```bash
# 1. Login to get JWT token
curl -X POST "https://kilele.mid4s.site/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPass123"}'

# 2. Initiate payment (use token from step 1)
curl -X POST "https://kilele.mid4s.site/api/v1/payments/initiate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -d '{"phone_number": "0723335139"}'
```

### Test Webhook Locally
```bash
# Simulate IntaSend webhook
curl -X POST "https://kilele.mid4s.site/api/v1/payments/webhook" \
  -H "Content-Type: application/json" \
  -H "X-IntaSend-Signature: <HMAC_SIGNATURE>" \
  -d '{"invoice_id": "Y626RPD", "state": "COMPLETE"}'
```

### Check Payment Status
```bash
curl -X GET "https://kilele.mid4s.site/api/v1/payments/status/3" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

## M-PESA Specific Issues

### User Not Receiving STK Push
**Possible Causes:**
1. **Network Issues**: Poor signal, M-PESA service down
2. **Phone Format**: Number not properly formatted to 254XXXXXXXXX
3. **IntaSend Configuration**: Wrong merchant settings
4. **Account Issues**: M-PESA account blocked/suspended

**Verification:**
- Check logs show `STK push response: {...}` with `state: PENDING`
- Confirm phone number in logs: `254723335139`
- Test with different phone number

### STK Push Timeout
**M-PESA prompts expire after ~2 minutes**
- Frontend polls for 60 seconds
- User should complete payment within prompt timeout
- Failed prompts can be retried

## Production Monitoring

### Key Metrics to Watch
```bash
# Payment success rate
heroku logs --app kilele | grep "Payment.*completed" | wc -l

# Webhook processing
heroku logs --app kilele | grep "Webhook.*ok" | wc -l

# Failed payments
heroku logs --app kilele | grep "Payment.*FAILED\|Payment.*CANCELLED" | wc -l
```

### Alert Conditions
- High 500 error rate on payment endpoints
- Webhook signature verification failures
- STK push API errors
- Database connection issues