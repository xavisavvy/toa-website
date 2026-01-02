# Tales of Aneria - Feature Roadmap & Checklist

**Last Updated:** 2026-01-02

## 🎯 Current Sprint

### In Progress
- [ ] Update sponsors endpoint with sponsorship contact link (best practices)

### Up Next
- [ ] TBD

---

## 📋 Feature Backlog

### High Priority

#### 🤝 Sponsorship & Marketing
- [ ] **Sponsor Contact CTA** - Add "Contact Us About Sponsorship" link
  - [ ] Research social media sponsorship best practices
  - [ ] Design compelling CTA with value proposition
  - [ ] Create dedicated sponsorship landing page/modal
  - [ ] Add analytics tracking for sponsor interest
  - [ ] Implement professional contact form
  - [ ] Add sponsorship packages/tiers information
  - [ ] Include social media metrics/audience data
  - [ ] Set up email notification for sponsor inquiries
  - [ ] A/B test CTA placement and messaging
  - Related: Sponsors endpoint, marketing strategy



#### 📺 Content Management
- [x] **Switch from Playlists to All Channel Videos** - Fetch all videos from YouTube channel ✅ COMPLETE
  - [x] Update YouTube API integration to use channel search
  - [x] Sort videos by publish date (newest first)
  - [x] Update environment variables (VITE_YOUTUBE_CHANNEL_ID)
  - [x] Update frontend components (LatestEpisodes, Home)
  - [x] Backward compatible (supports both channel and playlists)
  - [x] Test with real channel data (UC7PTdudxJ43HMLJVv2QxVoQ)
  - [x] Update documentation
  - Related: server/youtube.ts, client/src/components/LatestEpisodes.tsx

#### 🎨 User Experience
- [ ] TBD - Add items as you discover needs

#### 🔒 Security & Performance
- [ ] TBD - Add items as you discover needs

#### 📱 Social Media Integration
- [ ] TBD - Add items as you discover needs

---

### Medium Priority

#### 📊 Analytics & Metrics
- [ ] TBD - Add items as you discover needs

#### 🧪 Testing Improvements
- [ ] TBD - Add items as you discover needs

---

### Low Priority / Nice to Have

#### 🎨 UI/UX Polish
- [ ] TBD - Add items as you discover needs

#### 📚 Content Management
- [ ] TBD - Add items as you discover needs

---

## ✅ Completed Features

### 2026-01-02
- [x] **GitHub Actions Cache Management** - Programmatic cache cleanup solution
  - Automated cleanup script with multiple strategies
  - Comprehensive documentation
  - Dry-run mode for safe preview
  - Bulk deletion (vs manual UI clicking)
  - Resolves: Cache limit warning (9.95 GB / 10 GB)
- [x] **Pre-Push Quality Gate** - Automated testing before code push
  - Pre-push hook runs full test suite with coverage
  - Blocks push if tests fail or coverage drops below 80%
  - Never lets coverage drop below threshold
- [x] **Routes Test Coverage** - Achieved 97.19% coverage
  - Added 17 comprehensive tests for YouTube & Audio Proxy endpoints
  - Security testing (SSRF, injection, validation)
  - Error handling and edge cases
  - Exceeded 80% threshold requirement
- [x] YouTube Channel Videos API - Fetch all videos from channel (newest first)
- [x] Frontend integration for channel videos
- [x] Backward compatibility with playlists

### 2026-01-01
- [x] CI/CD build time optimization (20-30% faster)
- [x] Fixed flaky network timeout test
- [x] Fixed flaky uptime monitoring test
- [x] Added build step for E2E tests
- [x] Docker SBOM build error fix
- [x] GitHub Copilot instructions and trigger words
- [x] Automated testing on file changes documentation
- [x] Agentic SDLC optimization guide
- [x] AI context folder structure (.ai/)

---

## 📝 Template for Adding New Features

Copy this template when adding a new feature:

```markdown
### Feature Category

- [ ] **Feature Name** - Brief description
  - [ ] Sub-task 1
  - [ ] Sub-task 2
  - [ ] Sub-task 3
  - [ ] Tests written and passing
  - [ ] Documentation updated
  - Related: [related features/files]
```

---

## 🎯 Current Focus: Sponsorship Contact Feature

### Task Breakdown

#### 1. Research Phase
- [ ] Analyze successful TTRPG/podcast sponsorship models
- [ ] Review social media sponsorship best practices
- [ ] Identify key metrics sponsors care about
- [ ] Document audience demographics and engagement

#### 2. Design Phase
- [ ] Design sponsorship value proposition
- [ ] Create CTA button/link design (accessible)
- [ ] Design contact form (if needed)
- [ ] Design sponsorship packages page
- [ ] Create sponsor media kit

#### 3. Implementation Phase
- [ ] Add sponsor contact link to sponsors endpoint
- [ ] Create contact form with Zod validation
- [ ] Set up email notification system
- [ ] Add analytics tracking
- [ ] Implement rate limiting on contact form
- [ ] Create sponsorship information page

#### 4. Content Phase
- [ ] Write compelling CTA copy
- [ ] Create sponsorship packages/tiers
- [ ] Add social media metrics (followers, engagement)
- [ ] Include audience demographics
- [ ] Add testimonials (if any)
- [ ] Create sponsor benefits list

#### 5. Testing Phase
- [ ] Unit tests for contact form validation
- [ ] E2E test for sponsor inquiry flow
- [ ] Accessibility testing (WCAG 2.1 AA)
- [ ] Mobile responsiveness testing
- [ ] Email notification testing
- [ ] Analytics tracking verification

#### 6. Launch Phase
- [ ] Deploy to production
- [ ] Monitor analytics
- [ ] A/B test different CTAs
- [ ] Gather feedback
- [ ] Iterate based on data

---

## 🔍 Best Practices for Social Media Sponsorships

### What Sponsors Want to See
1. **Audience Size & Growth**
   - Total followers across platforms
   - Monthly growth rate
   - Engagement rates (likes, shares, comments)

2. **Audience Demographics**
   - Age ranges
   - Geographic distribution
   - Interests and behaviors

3. **Content Performance**
   - Average views per post/video
   - Watch time / retention
   - Click-through rates

4. **Professional Presentation**
   - Media kit with statistics
   - Clear sponsorship packages
   - Previous sponsor testimonials
   - Professional contact process

5. **Value Proposition**
   - What makes your audience unique?
   - Alignment with sponsor brand values
   - Creative integration opportunities

### CTA Best Practices
- **Clear and Direct**: "Partner With Us" or "Become a Sponsor"
- **Value-Focused**: Highlight what they get
- **Low Friction**: Easy to contact (form or email)
- **Professional**: Use business email, quick response time
- **Data-Driven**: Include metrics prominently

---

## 🚀 Quick Add Feature Commands

Use these when you discover new features to add:

```bash
# Add high priority feature
echo "- [ ] Feature name - Description" >> ROADMAP.md

# Mark feature complete
# Edit file and change [ ] to [x]

# Move feature to completed
# Cut from backlog and paste in completed section with date
```

---

## 📊 Progress Tracking

### Sprint Goals
- **Current Sprint**: Implement sponsorship contact feature
- **Target Date**: TBD
- **Success Criteria**: 
  - Sponsor contact link live on production
  - Contact form working with email notifications
  - Analytics tracking sponsor interest
  - Accessibility compliant

### Metrics to Track
- Number of sponsor inquiries per month
- Conversion rate (views → contact)
- Time to respond to inquiries
- User engagement with sponsor content

---

## 💡 Ideas & Future Considerations

### Brainstorming (Unsorted)
- Social proof (testimonials from current sponsors)
- Sponsor showcase section on homepage
- Automated media kit generation
- Sponsor portal for tracking campaign performance
- Integration with email marketing tools
- Discord/community integration for sponsors
- Exclusive sponsor content/perks

### Technical Debt
- TBD - Track technical improvements needed

### Documentation Needs
- TBD - Track documentation that needs updating

---

## 🎯 How to Use This Roadmap

### Daily Workflow
1. Check "Current Sprint" section
2. Work on unchecked items
3. Check off completed items
4. Add new discoveries to backlog

### Planning
1. Review backlog weekly
2. Prioritize based on business value
3. Move items to "Current Sprint"
4. Break down into sub-tasks

### Reporting
1. Update "Completed Features" when done
2. Track metrics for important features
3. Use for retrospectives

---

**Notes:**
- This is a living document - update frequently!
- Use conventional commits when implementing features
- Link to GitHub issues for complex features
- Keep backlog prioritized and groomed


