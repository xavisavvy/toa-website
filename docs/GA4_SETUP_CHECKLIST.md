# GA4 Quick Setup Checklist

Use this checklist while configuring your GA4 dashboard.

## 🎯 Step 1: Mark Events as Conversions (5 min)

**Admin → Events → Toggle "Mark as conversion"**

- [ ] `purchase` - Primary revenue conversion ⭐
- [ ] `begin_checkout` - Checkout started
- [ ] `video_play` - Video engagement (optional)
- [ ] `podcast_play` - Podcast engagement (optional)
- [ ] `external_link_click` - Social engagement (optional)

**Note:** Events must fire at least once before appearing in this list.

---

## 📊 Step 2: Create Custom Dimensions (10 min)

**Admin → Custom definitions → Create custom dimension**

### Video Title
- [ ] Dimension name: `video_title`
- [ ] Scope: Event
- [ ] Event parameter: `video_title`

### Character Name
- [ ] Dimension name: `character_name`
- [ ] Scope: Event
- [ ] Event parameter: `character_name`

### Podcast Platform
- [ ] Dimension name: `platform`
- [ ] Scope: Event
- [ ] Event parameter: `platform`

### External URL
- [ ] Dimension name: `external_url`
- [ ] Scope: Event
- [ ] Event parameter: `url`

### Product Name
- [ ] Dimension name: `item_name`
- [ ] Scope: Event
- [ ] Event parameter: `item_name`

---

## 🎭 Step 3: Create Audiences (10 min) - Optional

**Admin → Audiences → New audience**

### Recent Purchasers
- [ ] Name: "Recent Purchasers (30 days)"
- [ ] Condition: Event name = `purchase`, Last 30 days

### Cart Abandoners
- [ ] Name: "Cart Abandoners"
- [ ] Condition: `begin_checkout` but not `purchase`, Last 7 days

### Engaged Content Viewers
- [ ] Name: "Engaged Content Viewers"
- [ ] Condition: `video_play` count ≥ 3, Last 30 days

---

## 📈 Step 4: Create Custom Reports (15 min) - Optional

**Explore → Blank template**

### E-commerce Funnel
- [ ] Type: Funnel exploration
- [ ] Steps: view_item → begin_checkout → purchase
- [ ] Save as: "E-commerce Funnel"

### Content Performance
- [ ] Type: Free form
- [ ] Dimension: video_title
- [ ] Metric: Event count
- [ ] Save as: "Content Performance"

### Podcast Platforms
- [ ] Type: Free form
- [ ] Dimension: platform
- [ ] Filter: Event name = podcast_play
- [ ] Save as: "Podcast Platform Preferences"

---

## ✅ Step 5: Verify Everything Works (5 min)

### Realtime Check
- [ ] Go to Reports → Realtime → Overview
- [ ] Visit your site: https://talesofaneria.com
- [ ] Perform these actions:
  - [ ] Click a video
  - [ ] Click a podcast platform
  - [ ] View a character page
  - [ ] Click a social link
- [ ] Verify events appear in Realtime dashboard

### Events List Check
- [ ] Go to Reports → Engagement → Events
- [ ] Verify you see these events:
  - [ ] page_view
  - [ ] video_play
  - [ ] podcast_play
  - [ ] external_link_click
  - [ ] view_item (after visiting /shop)
  - [ ] character_view

---

## 🎉 Setup Complete!

**Next Actions:**
- [ ] Monitor Realtime dashboard for 24 hours
- [ ] Check standard reports after 24 hours
- [ ] Review weekly metrics
- [ ] Set up email alerts (Admin → Insights)

**Bookmark These:**
- Realtime: [Direct Link](https://analytics.google.com/analytics/web/#/p{YOUR_PROPERTY_ID}/realtime/overview)
- Conversions: [Direct Link](https://analytics.google.com/analytics/web/#/p{YOUR_PROPERTY_ID}/reports/conversions)

---

**Total Setup Time:** ~30-45 minutes
**Date Completed:** __________
**Configured By:** __________
