# Google Analytics 4 - Key Events Configuration Guide

## Overview

Configure these key events (conversions) in your GA4 dashboard to track important user actions and measure success metrics.

## Access GA4 Dashboard

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property: **G-J52BYG13XQ**
3. Navigate to: **Admin** (bottom left)

---

## Step 1: Mark Events as Conversions

### Navigate to Conversions

1. In Admin panel, click **Events** (under Data Display)
2. Wait for events to populate (may take 24 hours for first events)
3. Toggle "Mark as conversion" for the following events:

### Primary Conversions (Revenue)

#### 1. `purchase` ⭐ **HIGHEST PRIORITY**
- **What:** User completed a purchase
- **Why:** Primary revenue conversion
- **Value:** Tracks total revenue
- **Mark as:** ✅ Conversion

#### 2. `begin_checkout` 💳
- **What:** User initiated checkout process
- **Why:** Micro-conversion, measures checkout abandonment
- **Value:** Helps identify drop-off points
- **Mark as:** ✅ Conversion

### Secondary Conversions (Engagement)

#### 3. `video_play` 🎥
- **What:** User clicked to watch a YouTube episode
- **Why:** Content engagement goal
- **Value:** Measures episode popularity
- **Mark as:** ✅ Conversion (optional, but recommended)

#### 4. `podcast_play` 🎧
- **What:** User clicked to listen on podcast platform
- **Why:** Podcast engagement goal
- **Value:** Measures podcast platform preferences
- **Mark as:** ✅ Conversion (optional)

#### 5. `external_link_click` 🔗
- **What:** User clicked social media or external link
- **Why:** Social engagement goal
- **Value:** Measures social traffic generation
- **Mark as:** ✅ Conversion (optional)

---

## Step 2: Create Custom Dimensions

### Navigate to Custom Definitions

1. In Admin panel, click **Custom definitions** (under Data Display)
2. Click **Create custom dimension**
3. Add the following dimensions:

### Dimension 1: Video Title
```
Dimension name: video_title
Scope: Event
Event parameter: video_title
Description: Title of the video played
```

### Dimension 2: Character Name
```
Dimension name: character_name
Scope: Event
Event parameter: character_name
Description: Name of the character viewed
```

### Dimension 3: Podcast Platform
```
Dimension name: platform
Scope: Event
Event parameter: platform
Description: Podcast platform clicked (Spotify, Apple, etc)
```

### Dimension 4: External URL
```
Dimension name: external_url
Scope: Event
Event parameter: url
Description: Destination URL of external link
```

### Dimension 5: Product Name
```
Dimension name: item_name
Scope: Event
Event parameter: item_name
Description: Name of product viewed/purchased
```

---

## Step 3: Create Audiences (Optional)

### Navigate to Audiences

1. In Admin panel, click **Audiences** (under Data Display)
2. Click **New audience**
3. Create the following audiences:

### Audience 1: Recent Purchasers
```
Name: Recent Purchasers (30 days)
Description: Users who made a purchase in last 30 days
Conditions:
  - Event name = purchase
  - Within last 30 days
Use for: Remarketing, loyalty campaigns
```

### Audience 2: Cart Abandoners
```
Name: Cart Abandoners
Description: Users who started checkout but didn't complete
Conditions:
  - Event name = begin_checkout
  - Event name ≠ purchase (within same session)
  - Within last 7 days
Use for: Retargeting campaigns
```

### Audience 3: Engaged Content Viewers
```
Name: Engaged Content Viewers
Description: Users who watched 3+ videos
Conditions:
  - Event name = video_play
  - Event count ≥ 3
  - Within last 30 days
Use for: Newsletter signup campaigns
```

### Audience 4: Social Engagers
```
Name: Social Engagers
Description: Users who clicked social media links
Conditions:
  - Event name = external_link_click
  - Event count ≥ 1
  - Within last 7 days
Use for: Social media growth campaigns
```

---

## Step 4: Create Custom Reports

### Navigate to Explore

1. Click **Explore** in left sidebar
2. Click **Blank** template
3. Create the following reports:

### Report 1: E-commerce Funnel

**Configuration:**
```
Name: E-commerce Funnel
Type: Funnel exploration
Steps:
  1. view_item (Product Views)
  2. begin_checkout (Checkout Started)
  3. purchase (Purchase Complete)
Breakdown: Device category, Traffic source
Date range: Last 30 days
```

**Use:** Identify where users drop off in purchase flow

### Report 2: Content Performance

**Configuration:**
```
Name: Content Performance
Type: Free form
Dimensions: video_title (or Event name)
Metrics: Event count, Total users, Engagement rate
Filters: Event name = video_play
Date range: Last 30 days
```

**Use:** Identify most popular episodes

### Report 3: Podcast Platform Analysis

**Configuration:**
```
Name: Podcast Platform Preferences
Type: Free form
Dimensions: platform
Metrics: Event count, Total users
Filters: Event name = podcast_play
Date range: Last 30 days
Visualization: Pie chart
```

**Use:** Optimize podcast distribution strategy

### Report 4: Social Traffic Analysis

**Configuration:**
```
Name: Social Media Effectiveness
Type: Free form
Dimensions: external_url
Metrics: Event count, Total users
Filters: Event name = external_link_click
Date range: Last 30 days
```

**Use:** Measure social media ROI

---

## Step 5: Set Up Conversion Goals

### Navigate to Conversion Goals

1. In Admin panel, click **Conversions** (under Data Display)
2. For each marked conversion, set the following:

### Goal 1: Revenue Target
```
Conversion: purchase
Target: $500/month (adjust based on your goals)
Alert: Email when < $100/week
```

### Goal 2: Checkout Initiation
```
Conversion: begin_checkout
Target: 50/month
Alert: Email when conversion rate < 10%
```

### Goal 3: Content Engagement
```
Conversion: video_play
Target: 500/month
Alert: Email when < 100/week
```

---

## Step 6: Enable Enhanced Measurement (if not already)

### Navigate to Data Streams

1. In Admin panel, click **Data streams**
2. Click your web stream
3. Click **Enhanced measurement**
4. Ensure these are enabled:
   - ✅ Page views
   - ✅ Scrolls
   - ✅ Outbound clicks
   - ✅ Site search (if applicable)
   - ✅ Video engagement (if using embedded videos)
   - ✅ File downloads

---

## Step 7: Link to Google Ads (Optional)

### If you run Google Ads:

1. In Admin panel, click **Google Ads Links**
2. Click **Link**
3. Select your Google Ads account
4. Enable conversion import:
   - ✅ purchase
   - ✅ begin_checkout

**Benefit:** Use GA4 conversions in Google Ads for better targeting

---

## Step 8: Set Up Alerts

### Navigate to Insights

1. Click **Insights** in left sidebar
2. Click **Create custom insight**
3. Set up the following alerts:

### Alert 1: Revenue Drop
```
Name: Weekly Revenue Alert
Metric: Purchase revenue
Condition: Decreased by 20% vs previous week
Frequency: Weekly
Recipients: Your email
```

### Alert 2: Traffic Spike
```
Name: Traffic Spike Alert
Metric: Active users
Condition: Increased by 50% vs previous day
Frequency: Daily
Recipients: Your email
```

---

## Verification Checklist

After configuration, verify everything is working:

### ✅ Events Appearing
1. Go to **Reports** → **Realtime**
2. Perform actions on your site:
   - Click a video
   - Click a podcast platform
   - View a character page
   - Click a social link
   - View a shop product
3. Verify events appear in Realtime dashboard

### ✅ Conversions Marked
1. Go to **Admin** → **Events**
2. Verify "Mark as conversion" is toggled for:
   - purchase ✅
   - begin_checkout ✅
   - video_play ✅ (optional)

### ✅ Custom Dimensions Created
1. Go to **Admin** → **Custom definitions**
2. Verify all 5 dimensions exist

### ✅ Data Flowing
1. Go to **Reports** → **Engagement** → **Events**
2. See all events with data:
   - page_view
   - video_play
   - podcast_play
   - external_link_click
   - view_item
   - begin_checkout
   - purchase (may take time for first purchase)

---

## Expected Timeline

| Timeframe | What to Expect |
|-----------|---------------|
| **Immediately** | Realtime events appear |
| **1 hour** | Events appear in standard reports |
| **24 hours** | Full event history available |
| **24-48 hours** | Custom dimensions populate |
| **7 days** | Audiences start populating |
| **30 days** | Full trend analysis available |

---

## Key Metrics to Monitor

### Daily Checks (First Week)
- ✅ Active users (Realtime)
- ✅ Events firing correctly
- ✅ No errors in debugger

### Weekly Checks (Ongoing)
- 📊 Total revenue (purchase events)
- 📊 Conversion rate (begin_checkout → purchase)
- 📊 Top performing content (video_play)
- 📊 Social engagement (external_link_click)

### Monthly Reviews
- 📈 Month-over-month growth
- 📈 User behavior trends
- 📈 Channel effectiveness
- 📈 Device/location insights

---

## Troubleshooting

### Events not appearing?
1. Check Realtime reports first (immediate)
2. Wait 1-2 hours for standard reports
3. Verify `VITE_GA_MEASUREMENT_ID` is set correctly in Replit
4. Check browser console for errors
5. Disable ad blockers during testing

### Conversions not marking?
1. Events must fire at least once before appearing in list
2. Wait 24 hours after first event
3. Refresh the Events page

### Custom dimensions empty?
1. Must have data for at least 24-48 hours
2. Verify event parameters are being sent (check DebugView)

---

## Support Resources

- **GA4 Help Center:** https://support.google.com/analytics/
- **Measurement Protocol:** https://developers.google.com/analytics/devguides/collection/protocol/ga4
- **DebugView:** https://support.google.com/analytics/answer/7201382
- **Event Builder:** https://ga-dev-tools.google/ga4/event-builder/

---

## Quick Access Links

After setup, bookmark these:

- **Realtime Dashboard:** Analytics → Realtime → Overview
- **Conversion Tracking:** Analytics → Engagement → Conversions
- **E-commerce:** Analytics → Monetization → Overview
- **Custom Reports:** Analytics → Explore → (Your saved reports)

---

**Configuration Date:** 2026-01-02
**Measurement ID:** G-J52BYG13XQ
**Status:** Ready to configure
**Estimated Setup Time:** 30-45 minutes
