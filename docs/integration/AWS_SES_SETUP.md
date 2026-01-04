# AWS SES Email Integration Guide

This guide walks you through setting up Amazon Simple Email Service (SES) for sending transactional emails (order confirmations, payment notifications, admin alerts).

## 📋 Prerequisites

- AWS Account (free tier available)
- Domain name (optional but recommended for production)
- Node.js application with environment variable support

## 🚀 Quick Setup Steps

### 1. Create AWS Account & IAM User

1. **Sign in to AWS Console**: https://console.aws.amazon.com/
2. **Navigate to IAM**: https://console.aws.amazon.com/iam/
3. **Create IAM User**:
   - Click "Users" → "Add users"
   - User name: `toa-ses-user`
   - Select "Programmatic access"
   - Click "Next: Permissions"

4. **Attach SES Permissions**:
   - Click "Attach existing policies directly"
   - Search for and select `AmazonSESFullAccess`
   - Click "Next: Tags" → "Next: Review" → "Create user"

5. **Save Credentials**:
   - ⚠️ **IMPORTANT**: Save the Access Key ID and Secret Access Key
   - You won't be able to view the secret again
   - Store them securely (password manager recommended)

### 2. Configure SES in AWS Console

1. **Navigate to SES**: https://console.aws.amazon.com/ses/
2. **Select Region**: Choose your preferred region (e.g., `us-east-1`)
   - ⚠️ Note: SES is region-specific, remember your choice

#### Option A: Verify Individual Email Address (Quick Start)

**Best for**: Testing, development, small-scale use

1. Go to **Verified identities** → **Create identity**
2. Select **Email address**
3. Enter your email: `noreply@talesofaneria.com`
4. Click **Create identity**
5. Check your email inbox for verification email
6. Click the verification link

**Limitations**:
- Can only send FROM verified addresses
- Can only send TO verified addresses (SES Sandbox mode)
- Limited to 200 emails/day, 1 email/second

#### Option B: Verify Domain (Production Recommended)

**Best for**: Production, professional setup, higher volumes

1. Go to **Verified identities** → **Create identity**
2. Select **Domain**
3. Enter your domain: `talesofaneria.com`
4. Select **Easy DKIM** (recommended)
5. Click **Create identity**
6. Copy the DNS records provided
7. Add DNS records to your domain registrar:
   - 3 CNAME records for DKIM
   - 1 TXT record for domain verification
8. Wait for verification (can take up to 72 hours, usually < 1 hour)

**Benefits**:
- Send from any address @yourdomain.com
- More professional appearance
- Better deliverability
- Required for production access

### 3. Request Production Access (Remove Sandbox)

**When to do this**: Before going to production

SES starts in "Sandbox mode" with these limitations:
- Can only send TO verified email addresses
- Limited sending quota (200 emails/day)

**Steps to Request Production Access**:

1. Go to **Account Dashboard** in SES Console
2. Click **Request production access**
3. Fill out the form:
   - **Mail type**: Transactional
   - **Website URL**: https://talesofaneria.com
   - **Use case description**:
     ```
     We are a TTRPG live play website selling merchandise.
     We need to send transactional emails for:
     - Order confirmations
     - Shipping notifications
     - Payment receipts
     
     Expected volume: ~100-500 emails/month
     
     We have implemented double opt-in for marketing emails
     and honor all unsubscribe requests immediately.
     ```
   - **Compliance**: Describe how you handle bounces/complaints
   - **Acknowledge**: Check the compliance boxes

4. Submit request
5. Wait for approval (typically 24-48 hours)
6. AWS will review and grant production access

### 4. Configure Environment Variables

Add these to your `.env` file:

```bash
# AWS SES Configuration
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=AKIA... # From IAM user creation
AWS_SES_SECRET_ACCESS_KEY=... # From IAM user creation
AWS_SES_FROM_EMAIL=noreply@talesofaneria.com # Must be verified
```

**For Production (Vercel/Railway/etc.)**:
1. Go to your hosting platform's dashboard
2. Navigate to Environment Variables
3. Add the same variables above
4. Redeploy your application

### 5. Test Email Sending

**Quick Test Script** (`scripts/test-ses.ts`):

```typescript
import { sendEmail } from '../server/notification-service';

async function testEmail() {
  try {
    const result = await sendEmail({
      to: 'your-email@example.com', // Use verified email if in sandbox
      subject: 'Test Email from Tales of Aneria',
      body: 'This is a test email sent via AWS SES.',
      html: '<h1>Test Email</h1><p>This is a test email sent via AWS SES.</p>',
    });
    
    console.log('Email sent:', result);
  } catch (error) {
    console.error('Email failed:', error);
  }
}

testEmail();
```

Run it:
```bash
npm run tsx scripts/test-ses.ts
```

## 🔒 Security Best Practices

### 1. IAM User Permissions
- ✅ Create dedicated IAM user for SES only
- ✅ Use `AmazonSESFullAccess` or custom policy with minimal permissions
- ❌ Don't use root AWS account credentials

### 2. Credential Management
- ✅ Store in environment variables (never commit to git)
- ✅ Use different credentials for dev/staging/production
- ✅ Rotate credentials every 90 days
- ✅ Use AWS Secrets Manager for production (optional)

### 3. Environment Variables
```bash
# .gitignore should include:
.env
.env.local
.env.production
```

### 4. Monitoring & Alerts
1. **Enable SES Sending Statistics**:
   - Go to SES Console → Account Dashboard
   - Enable detailed monitoring

2. **Set up CloudWatch Alarms**:
   - Bounce rate > 5%
   - Complaint rate > 0.1%
   - Daily sending quota > 80%

3. **Configure SNS for Bounce/Complaint Handling**:
   - Create SNS topics for bounces and complaints
   - Add email subscription for admin alerts
   - Update SES configuration to publish to SNS

## 📊 Monitoring & Troubleshooting

### Check Sending Statistics
```bash
# AWS CLI command
aws ses get-send-statistics --region us-east-1
```

### Common Issues

#### 1. "Email address not verified"
**Solution**: Verify the FROM email in SES Console

#### 2. "MessageRejected: Email address is not verified"
**Solution**: 
- If in sandbox: Verify the TO email
- If production needed: Request production access

#### 3. "AccessDenied: User is not authorized"
**Solution**: 
- Check IAM permissions
- Verify credentials in .env
- Ensure correct AWS region

#### 4. Emails going to spam
**Solutions**:
- Verify domain (not just email)
- Set up SPF, DKIM, DMARC records
- Build sender reputation gradually
- Include unsubscribe link
- Use proper email formatting

### Email Deliverability Best Practices

1. **Authentication**:
   - ✅ Enable DKIM (automatic with domain verification)
   - ✅ Add SPF record: `v=spf1 include:amazonses.com ~all`
   - ✅ Add DMARC record: `v=DMARC1; p=quarantine; rua=mailto:admin@talesofaneria.com`

2. **Content**:
   - ✅ Include text and HTML versions
   - ✅ Use proper subject lines (avoid spam words)
   - ✅ Include unsubscribe link (for marketing emails)
   - ✅ Include physical address (legal requirement for marketing)

3. **Sending Practices**:
   - ✅ Warm up new domains gradually
   - ✅ Monitor bounce/complaint rates
   - ✅ Remove hard bounces immediately
   - ✅ Honor unsubscribe requests within 10 days

## 💰 Costs

### Free Tier
- **Sending from EC2**: 62,000 emails/month FREE forever
- **Sending from other sources**: First 3,000 emails FREE (12 months)

### Pricing (after free tier)
- **$0.10 per 1,000 emails sent**
- **$0.12 per GB of attachments**

**Example**: 10,000 emails/month = ~$1/month

## 🎯 Expected Configuration for Tales of Aneria

### Development
```bash
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=AKIA... (dev IAM user)
AWS_SES_SECRET_ACCESS_KEY=... (dev secret)
AWS_SES_FROM_EMAIL=dev-noreply@talesofaneria.com # Verified
```

### Production
```bash
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=AKIA... (prod IAM user)
AWS_SES_SECRET_ACCESS_KEY=... (prod secret)
AWS_SES_FROM_EMAIL=noreply@talesofaneria.com # Domain verified
```

## 📚 Additional Resources

- [AWS SES Developer Guide](https://docs.aws.amazon.com/ses/latest/dg/)
- [AWS SES API Reference](https://docs.aws.amazon.com/ses/latest/APIReference/)
- [Email Deliverability Best Practices](https://docs.aws.amazon.com/ses/latest/dg/best-practices.html)
- [Moving Out of SES Sandbox](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html)

## 🤝 Support

If you encounter issues:
1. Check AWS SES Console for sending statistics
2. Review CloudWatch logs for error details
3. Contact AWS Support (included with AWS account)
4. Review this project's notification-service.ts for implementation

---

**Last Updated**: 2026-01-04
**Author**: Tales of Aneria Development Team
