# GitHub Actions Email Notification Configuration

**Issue:** Receiving too many individual emails for each failed GitHub Actions job  
**Solution:** Configure GitHub notification preferences to receive digest emails instead

---

## 🎯 Quick Fix: Configure GitHub Notifications

### Option 1: Reduce to Workflow-Level Notifications (Recommended)

**Steps:**

1. **Go to GitHub Notification Settings:**
   - Visit: https://github.com/settings/notifications
   - Or: Click your profile picture → Settings → Notifications

2. **Scroll to "Actions" section**

3. **Configure Actions notifications:**
   - Find "Send notifications for failed workflows only"
   - ✅ Enable this option
   - This sends ONE email per workflow run (not per job)

4. **Disable individual job notifications:**
   - Uncheck "Send a separate email for each failed job"
   - This prevents the flood of individual emails

5. **Save changes**

---

## Option 2: Disable Actions Emails Completely

If you prefer to check GitHub directly for failures:

1. **Go to:** https://github.com/settings/notifications
2. **Under "Actions":**
   - Uncheck "Email" for Actions notifications
   - Keep "Web" checked to see notifications in GitHub
3. **Save changes**

You'll still see notifications on GitHub.com but won't receive emails.

---

## Option 3: Weekly Digest Email

For less urgent notifications:

1. **Go to:** https://github.com/settings/notifications
2. **Under "Subscriptions":**
   - Find "Actions" section
   - Change to "Weekly digest"
3. **Save changes**

You'll receive one summary email per week instead of real-time notifications.

---

## 🔧 Repository-Specific Settings

To configure for just this repository:

1. **Go to your repository:**
   - https://github.com/xavisavvy/toa-website

2. **Click "Watch" button (top right)**

3. **Click "Custom"**

4. **Configure notifications:**
   - Uncheck "Actions" if you don't want any notifications for this repo
   - Or keep checked but configure global settings above

---

## 💡 Recommended Configuration

Based on your situation (over monthly Actions limit), I recommend:

```
Global Settings (https://github.com/settings/notifications):
├── Actions
│   ✅ Send notifications for failed workflows only
│   ❌ Send a separate email for each failed job
│   ✅ Web notifications ON
│   ❌ Email notifications OFF (or set to weekly digest)
└── Watching
    ✅ Automatically watch repositories
```

This configuration:
- ✅ Stops the email flood
- ✅ Still notifies you on GitHub.com
- ✅ One notification per workflow (not per job)
- ✅ Can check failures when you visit GitHub

---

## 🚫 Addressing the Root Issue: Actions Quota

You're hitting the 2,000 minutes/month limit on free GitHub Actions.

### Immediate Solutions:

#### 1. **Disable Non-Critical Workflows**

Create `.github/workflows/.disabled/` and move non-essential workflows there:

```bash
# In your repository
mkdir -p .github/workflows/.disabled
# Move workflows you don't need on every push
mv .github/workflows/mutation-testing.yml .github/workflows/.disabled/
mv .github/workflows/visual-testing.yml .github/workflows/.disabled/
```

#### 2. **Optimize Workflow Triggers**

Edit workflows to run less frequently:

**Before:**
```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
```

**After:**
```yaml
on:
  pull_request:
    branches: [ main ]
  # Only run on push to main, not develop
  push:
    branches: [ main ]
  # Or run on schedule instead
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
```

#### 3. **Use Workflow Dispatch (Manual Trigger)**

For expensive workflows like mutation testing:

```yaml
on:
  workflow_dispatch:  # Manual trigger only
  # Remove automatic triggers
```

#### 4. **Add Path Filters**

Only run workflows when relevant files change:

```yaml
on:
  push:
    paths:
      - 'src/**'
      - 'test/**'
      - 'package.json'
      - '.github/workflows/ci.yml'
    # Ignore documentation changes
    paths-ignore:
      - 'docs/**'
      - '**.md'
      - 'LICENSE'
```

#### 5. **Combine Jobs**

Reduce parallel jobs to save minutes:

**Before:** 5 separate jobs = 5x minutes
**After:** 1 job with sequential steps = 1x minutes

---

## 📊 Recommended Workflow Changes

Create this file: `.github/workflows/ci-optimized.yml`

```yaml
name: CI (Optimized for Free Tier)

on:
  push:
    branches: [ main ]
    paths:
      - 'src/**'
      - 'server/**'
      - 'client/**'
      - 'test/**'
      - 'package.json'
  pull_request:
    branches: [ main ]

jobs:
  # Run only essential checks
  essential:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7
        with:
          node-version: '20'
          cache: 'npm'
      
      # TypeScript check (fast)
      - run: npm ci
      - run: npm run check
      
      # Unit tests only (skip E2E to save minutes)
      - run: npm run test -- --run
      
      # Build check
      - run: npm run build

  # Run expensive tests only on PR or manual trigger
  extended:
    if: github.event_name == 'pull_request' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:e2e
```

---

## 🎯 Quick Action Plan

**Immediate (Today):**
1. ✅ Go to https://github.com/settings/notifications
2. ✅ Configure Actions to "failed workflows only"
3. ✅ Uncheck "separate email for each job"
4. ✅ Consider disabling email notifications entirely

**This Week:**
1. Review which workflows run most frequently
2. Disable or reduce frequency of non-critical workflows
3. Add path filters to workflows
4. Consider combining jobs

**Long Term:**
1. Monitor Actions usage: https://github.com/settings/billing
2. Upgrade to GitHub Pro ($4/month = 3,000 minutes)
3. Or use self-hosted runners (free, but requires server)

---

## 📱 Mobile App Notifications

If you use GitHub mobile app:

1. Open GitHub app
2. Go to Settings → Notifications
3. Configure Actions notifications same as web

---

## ✅ Verification

After changing settings:

1. Make a small commit to trigger a workflow
2. Check your email inbox
3. You should receive:
   - ❌ NOT: Individual emails for each job
   - ✅ YES: One email per workflow (or none if disabled)

---

## 📞 Need More Help?

- **GitHub Actions Billing:** https://github.com/settings/billing
- **Workflow Usage:** https://github.com/xavisavvy/toa-website/actions
- **GitHub Docs:** https://docs.github.com/en/account-and-profile/managing-subscriptions-and-notifications-on-github/setting-up-notifications/configuring-notifications

---

**Recommended Settings:**
```
✅ Failed workflows only: ON
❌ Separate email per job: OFF
✅ Web notifications: ON
❌ Email notifications: OFF (check GitHub directly)
```

This will stop the email flood immediately while you optimize your workflows! 🎉
