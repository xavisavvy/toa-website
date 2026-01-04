# AWS SES Quick Reference Card

**Last Updated:** 2026-01-04  
**Status:** ✅ TESTED & WORKING

---

## 🚀 Quick Commands

### Test Email Sending
```bash
npm run test:ses your-email@example.com
```

### Check Configuration
```bash
# Verify environment variables are set
echo $AWS_SES_REGION
echo $AWS_SES_FROM_EMAIL
```

---

## 📋 Environment Variables

Required in `.env`:
```bash
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=AKIA...
AWS_SES_SECRET_ACCESS_KEY=...
AWS_SES_FROM_EMAIL=noreply@talesofaneria.com
ADMIN_EMAIL=TalesOfAneria@gmail.com
```

---

## 📧 Email Functions

### Send Order Confirmation
Automatically triggered on successful Stripe payment:
```typescript
await sendOrderConfirmation(order, items);
```

### Send Payment Failure
Automatically triggered on failed payment:
```typescript
await sendPaymentFailureNotification(customerEmail, sessionId);
```

### Send Admin Alert
For system notifications:
```typescript
await sendAdminAlert('Subject', 'Message', metadata);
```

---

## 🔍 Troubleshooting

### Email Not Sending?
1. Check AWS credentials in `.env`
2. Verify FROM email in SES Console
3. Check recipient email (sandbox mode requires verification)
4. Review application logs for errors

### "Email address not verified"
- **Sandbox mode:** Both FROM and TO emails must be verified
- **Production:** Only FROM email needs verification
- **Solution:** Verify emails in AWS SES Console or request production access

### Cost Concerns?
- **Free tier:** 3,000 emails/month (first 12 months)
- **Paid:** $0.10 per 1,000 emails
- **Current usage:** ~100-500 emails/month = <$1/month

---

## 📊 Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| Installation | ✅ | @aws-sdk/client-ses installed |
| Configuration | ✅ | All env files updated |
| Testing | ✅ | Successfully tested 2026-01-04 |
| Documentation | ✅ | Complete setup guide available |
| Production Ready | ✅ | Working with sandbox mode |
| High Volume | ⏳ | Request production access when needed |

---

## 📚 Documentation

- **Setup Guide:** `docs/integration/AWS_SES_SETUP.md`
- **Integration Summary:** `docs/integration/AWS_SES_INTEGRATION_SUMMARY.md`
- **Test Script:** `scripts/test-ses.ts`

---

## 🎯 Next Steps (Optional)

### For Higher Sending Limits
1. Go to AWS SES Console → Account Dashboard
2. Click "Request production access"
3. Fill out the form with your use case
4. Wait for approval (24-48 hours)

### For Better Deliverability
1. Verify your domain (not just email)
2. Set up SPF, DKIM, DMARC records
3. Monitor bounce/complaint rates
4. Set up SNS notifications

---

## 💡 Tips

- **Development:** Use verified test emails
- **Staging:** Test with real production-like scenarios
- **Production:** Request production access before go-live
- **Monitoring:** Enable CloudWatch detailed monitoring
- **Security:** Rotate AWS credentials every 90 days

---

## ⚡ Emergency Contacts

- **AWS Support:** Available in AWS Console
- **Documentation:** https://docs.aws.amazon.com/ses/
- **Status Page:** https://status.aws.amazon.com/

---

**Quick Test:** `npm run test:ses your-email@example.com`  
**Questions?** See `docs/integration/AWS_SES_SETUP.md`
