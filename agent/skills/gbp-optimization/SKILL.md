---
name: gbp-optimization
description: Generates comprehensive Google Business Profile optimization plans, audits existing listings with scored checklists, and creates GBP-ready content assets for local SEO dominance.
---

# GBP Optimization

This skill orchestrates a full Google Business Profile optimization workflow -- from initial audit through content creation to ongoing monitoring. It produces client-ready deliverables including scored audits, prioritized roadmaps, optimized content assets, and executive summaries targeting Map Pack rankings and AI Overview visibility.

## When to Use This Skill

- Setting up a new Google Business Profile from scratch
- Auditing an existing GBP listing for optimization gaps
- Generating GBP-ready content (posts, Q&A, business descriptions, service descriptions)
- Managing multi-location GBP portfolios with consistent optimization
- Recovering from Map Pack ranking drops
- Preparing a business profile for AI Overviews and Gemini-powered search
- Benchmarking GBP performance against local competitors
- Producing client-ready GBP audit deliverables for agencies

## What This Skill Does

1. **Mode Detection**: Determines whether to run a full optimization plan, audit-only scorecard, content generation, or multi-location portfolio review
2. **Local Keyword Research**: Identifies location-specific keywords and optimal GBP categories via orchestrated sub-skills
3. **Competitive GBP Analysis**: Benchmarks the target profile against top Map Pack competitors
4. **16-Area Scored Audit**: Evaluates every GBP optimization area on a 1-10 scale with weighted overall score
5. **Area-by-Area Specifications**: Produces checklists, templates, and action items for all 16 optimization areas
6. **Prioritized Roadmap**: Creates a phased implementation plan (foundation, completion, content/engagement, maintenance)
7. **Content Asset Generation**: Writes business descriptions, post calendars, Q&A seeds, review response templates, and service descriptions
8. **Technical Implementation**: Generates JSON-LD LocalBusiness schema, location page specs, and technical audit items
9. **Monitoring Setup**: Defines KPIs, reporting cadence, tool stack, and cost estimates
10. **Executive Summary**: Synthesizes everything into a client-ready deliverable with overall score, top priorities, and projected outcomes

## How to Use

### Full Optimization Plan

```
Create a full GBP optimization plan for [business name], a [business type] in [city, state]. They currently have [X] reviews and their primary service is [service].
```

### Audit Only

```
Audit the Google Business Profile for [business name] in [city]. Score each optimization area and give me the top 5 priorities.
```

### Content Generation

```
Generate GBP content assets for [business name]: business description, 4-week post calendar, 15 Q&A seeds, and review response templates.
```

### Multi-Location

```
Create a GBP optimization plan for [business name] across their [X] locations in [cities/states]. Identify consistency issues and location-specific opportunities.
```

## Instructions

When a user requests GBP optimization:

### Step 1: Determine Mode and Gather Business Context

Identify the optimization mode based on the request:

- **Full Plan**: Complete 10-step optimization (default)
- **Audit Only**: Steps 1-5 with scorecard output
- **Content Generation**: Steps 1 and 7 only
- **Multi-Location**: Full plan repeated per location with cross-location consistency checks

Gather or ask for missing context:

```markdown
## Business Context Brief

| Field | Value |
|-------|-------|
| Business Name | [name] |
| Business Type / Industry | [type] |
| Primary Service | [service] |
| City, State | [location] |
| Service Area Radius | [miles/km or specific cities] |
| Current GBP URL | [url if available] |
| Website URL | [url] |
| Current Review Count / Rating | [count] / [rating] |
| Number of Locations | [1 or multi] |
| Primary Goal | [rankings / leads / visibility / audit] |
| Competitor Names (if known) | [names] |
```

### Step 2: Local Keyword and Category Research

Orchestrate **keyword-research** and **serp-analysis** to identify:

- Primary and secondary GBP category candidates (from Google's predefined list)
- Top local keywords by search volume and intent (e.g., "[service] in [city]", "[service] near me")
- SERP feature presence: Map Pack triggers, Local Service Ads, AI Overviews
- Keyword-to-category mapping showing which categories unlock which search terms

```markdown
## Local Keyword & Category Research

### Recommended Categories

| Priority | Category | Justification | Competitor Usage |
|----------|----------|---------------|-----------------|
| Primary | [category] | [reason] | [X of Y competitors use] |
| Secondary 1 | [category] | [reason] | [usage] |
| Secondary 2 | [category] | [reason] | [usage] |
| ... | ... | ... | ... |

### Top Local Keywords

| Keyword | Monthly Volume | Difficulty | Intent | Map Pack? | AI Overview? |
|---------|---------------|------------|--------|-----------|-------------|
| [keyword] | [vol] | [diff] | [intent] | Yes/No | Yes/No |
| ... | ... | ... | ... | ... | ... |
```

### Step 3: Competitive GBP Analysis

Orchestrate **competitor-analysis** to benchmark against the top 3-5 Map Pack competitors:

```markdown
## Competitive GBP Benchmark

| Metric | [Business] | Competitor 1 | Competitor 2 | Competitor 3 |
|--------|-----------|-------------|-------------|-------------|
| Review Count | [X] | [X] | [X] | [X] |
| Average Rating | [X] | [X] | [X] | [X] |
| Photo Count | [X] | [X] | [X] | [X] |
| Post Frequency | [X] | [X] | [X] | [X] |
| Q&A Count | [X] | [X] | [X] | [X] |
| Primary Category | [cat] | [cat] | [cat] | [cat] |
| Secondary Categories | [count] | [count] | [count] | [count] |
| Services Listed | [count] | [count] | [count] | [count] |
| Attributes Count | [count] | [count] | [count] | [count] |
| Website Schema | Yes/No | Yes/No | Yes/No | Yes/No |
| Response Rate | [%] | [%] | [%] | [%] |

### Key Competitive Gaps
- [Gap 1 with action]
- [Gap 2 with action]
- [Gap 3 with action]
```

### Step 4: GBP Profile Optimization Audit -- 16-Area Scorecard

Score each area 1-10 based on current state (1 = not started, 5 = partially done, 10 = fully optimized). Apply weights to calculate the overall score out of 100.

```markdown
## GBP Optimization Scorecard

| # | Optimization Area | Score (1-10) | Weight | Weighted Score | Status |
|---|-------------------|-------------|--------|---------------|--------|
| 1 | Primary & Secondary Category Selection | [X] | 10% | [X] | [status] |
| 2 | Service Area Configuration | [X] | 5% | [X] | [status] |
| 3 | NAP Consistency | [X] | 10% | [X] | [status] |
| 4 | Business Description (750 chars) | [X] | 5% | [X] | [status] |
| 5 | Services & Products Listing | [X] | 7% | [X] | [status] |
| 6 | Attributes Selection | [X] | 4% | [X] | [status] |
| 7 | Photo & Video Optimization | [X] | 8% | [X] | [status] |
| 8 | Google Posts Strategy | [X] | 7% | [X] | [status] |
| 9 | Q&A Management | [X] | 5% | [X] | [status] |
| 10 | Messaging & Communication | [X] | 4% | [X] | [status] |
| 11 | Review Management | [X] | 12% | [X] | [status] |
| 12 | Website Technical Backend | [X] | 8% | [X] | [status] |
| 13 | Local Content & Link Building | [X] | 5% | [X] | [status] |
| 14 | AI Overviews Optimization | [X] | 5% | [X] | [status] |
| 15 | Engagement & Popularity Signals | [X] | 3% | [X] | [status] |
| 16 | Booking Integration | [X] | 2% | [X] | [status] |
| | **Overall Score** | | **100%** | **[X]/100** | |

### Score Interpretation
- **80-100**: Highly optimized -- focus on maintenance and competitive edge
- **60-79**: Good foundation -- targeted improvements will yield quick gains
- **40-59**: Significant gaps -- prioritized optimization plan needed
- **20-39**: Major work required -- start with foundation areas
- **0-19**: Profile is effectively unoptimized -- full build-out needed
```

### Step 5: Area-by-Area Optimization Specifications

For each of the 16 areas, produce a detailed specification with checklists, templates, and action items.

**Area 1 -- Primary & Secondary Category Selection**
- Audit current categories against competitor usage and keyword mapping
- Recommend primary category based on highest-revenue service and search volume
- Recommend 2-9 secondary categories; avoid category stuffing
- Test category changes during low-traffic periods; document ranking impact after 2-4 weeks
- Tools: BrightLocal Local Search Results Checker, Semrush Local SEO

**Area 2 -- Service Area Configuration**
- List specific cities or ZIP codes (not states or regions)
- Stay hyper-local; relevance and proximity beat reach
- For SABs: configure realistic service radius; remove overly broad areas
- Review quarterly as business coverage changes

**Area 3 -- NAP Consistency**
- Run citation consistency audit (Whitespark Local Citation Finder or BrightLocal)
- Verify exact match across GBP, website header/footer, and all directories
- Check for keyword stuffing in business name; remove if present
- Update hours including holidays; set special hours for seasonal changes
- Fix inconsistencies immediately; prioritize top-50 citation sources

**Area 4 -- Business Description (750 chars)**
- Include primary service and main location in the first sentence
- Incorporate primary keyword naturally
- State the unique differentiator
- No links, promotions, or filler; clear natural language only
- Provide a ready-to-paste 750-character description

**Area 5 -- Services & Products Listing**
- Add every individual service with short description and pricing where possible
- Structure services to match keyword research from Step 2
- Group into logical service categories
- Include price ranges even if approximate; conversions increase significantly

**Area 6 -- Attributes Selection**
- Select all applicable: service-specific, accessibility, payment methods, scheduling, identity, seasonal
- Update immediately when business practices change
- Prioritize attributes that match high-volume search queries (e.g., "24/7", "free estimates")

**Area 7 -- Photo & Video Optimization**
- Target 100+ high-quality photos across categories: exterior, interior, team, products, services, before/after
- Note: geotagging EXIF data has been debunked as a ranking factor; focus on quality and quantity instead
- Add photos on a regular schedule (weekly or biweekly)
- Include short-form video (30-60s) of services, team, and facilities
- Use descriptive filenames before upload (e.g., "hvac-repair-austin-tx.jpg")

**Area 8 -- Google Posts Strategy**
- Publish at least 1 post per week; posts stay active for 7 days
- Content mix: project highlights with before/after, seasonal tips, customer testimonials, promotions, events
- Include local keywords and clear calls-to-action in every post
- Note: native post scheduling is available in GBP as of 2026
- Track post views and clicks to refine content strategy

**Area 9 -- Q&A Management**
- Note: the Q&A API was deprecated in November 2025; Gemini is replacing traditional Q&A with AI-generated answers
- Seed profile with 10-15 FAQs and detailed answers manually through the GBP interface
- Monitor weekly for new questions; respond within 24 hours
- Structure answers to be picked up by Gemini summaries: clear, factual, concise

**Area 10 -- Messaging & Communication**
- Enable Google messaging and respond within 15 minutes during business hours
- Set up automated after-hours responses with phone number and emergency contact
- Note: WhatsApp and SMS integration available in 2026 for eligible business types
- Keep average response time under 1 hour for maximum trust signals
- Track message volume and conversion rate

**Area 11 -- Review Management**
- Implement "Golden Hour" strategy: send review requests via text ~1 hour after service completion
- Tools: Podium, Birdeye, or similar for automated timing
- Respond to ALL reviews (positive and negative) -- response speed is now tracked as a ranking signal
- Review sentiment is a direct ranking factor; address negative feedback constructively
- Target: maintain 4.5+ average with steady review velocity
- Provide review response templates for positive, negative, and neutral reviews

**Area 12 -- Website Technical Backend**
- Generate LocalBusiness JSON-LD schema matching GBP data exactly
- Build dedicated location pages for each service area: "[service] in [city/neighborhood]" with unique content
- No city-swap templates -- each location page must have genuinely unique content about local landmarks, area-specific challenges, and service details
- Include geo-targeting in URL structure, headings, and meta tags
- Embed Google Map on contact page or footer paired with schema
- Link website to GBP and vice versa for mutual validation

**Area 13 -- Local Content & Link Building**
- Write blog posts about local events, area-specific service challenges, seasonal maintenance tips
- Build local links through community involvement: sponsor teams, chamber of commerce, local news mentions
- Target local resource pages, neighborhood guides, and city directories
- Create location-specific content hubs for each major service area

**Area 14 -- AI Overviews Optimization (NEW)**
- AI Overviews appear in 85%+ of local searches as of 2025-2026
- Structure website content with clear, factual answers to common local queries
- Use FAQ schema and question-answer format on service pages
- Ensure GBP data and website content are consistent (AI cross-references both)
- Target featured snippet formats: tables, numbered lists, concise definitions
- Monitor AI Overview citations using rank-tracker sub-skill

**Area 15 -- Engagement & Popularity Signals (NEW)**
- Google's 2026 algorithm shift increases weight of engagement metrics
- Driving directions requests, click-to-call, website clicks, and photo views all count
- Encourage customers to interact with the profile: save, share, request directions
- Track engagement metrics in GBP Insights monthly
- Correlate engagement trends with ranking changes
- Higher engagement = stronger ranking signal; prioritize calls-to-action that drive profile interactions

**Area 16 -- Booking Integration (NEW)**
- Evaluate Reserve with Google vs. manual booking link
- Reserve with Google: native integration, in-SERP booking, supported for eligible verticals (restaurants, salons, fitness, etc.)
- Manual booking link: works for any business, links to website scheduler
- Configure booking button with correct URL and tracking parameters
- Test booking flow monthly; broken booking links hurt conversions and trust

### Step 6: Prioritized Implementation Roadmap

Organize all action items into four phases:

```markdown
## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
Priority: Critical items that directly affect ranking eligibility

- [ ] Verify/correct primary and secondary categories
- [ ] Fix all NAP inconsistencies across top-50 citation sources
- [ ] Write and publish optimized 750-char business description
- [ ] Complete all services and products listings
- [ ] Enable messaging with automated responses
- [ ] Select all applicable attributes

### Phase 2: Completion (Week 3-4)
Priority: Fill optimization gaps identified in the scorecard

- [ ] Upload photos to reach 100+ total (exterior, interior, team, services)
- [ ] Seed 10-15 Q&A entries
- [ ] Configure precise service areas (remove overly broad areas)
- [ ] Set up booking integration
- [ ] Respond to all unanswered reviews

### Phase 3: Content & Engagement (Week 5-8)
Priority: Ongoing content and engagement-driving activities

- [ ] Launch weekly Google Posts schedule (4-week calendar provided)
- [ ] Implement Golden Hour review request workflow
- [ ] Publish location-specific landing pages with unique content
- [ ] Deploy LocalBusiness JSON-LD schema on website
- [ ] Begin local link building outreach
- [ ] Optimize website content for AI Overviews

### Phase 4: Maintenance (Ongoing)
Priority: Sustain and improve rankings over time

- [ ] Weekly: publish Google Post, respond to reviews and messages, monitor Q&A
- [ ] Monthly: upload new photos, track engagement metrics in GBP Insights, review booking flow
- [ ] Quarterly: re-audit scorecard, update services/attributes, refresh business description, analyze competitor changes
- [ ] Annually: full competitive re-benchmark, category review, NAP audit across all directories
```

### Step 7: Content Generation

Orchestrate **seo-content-writer** to produce the following GBP content assets:

```markdown
## GBP Content Assets

### Optimized Business Description (750 characters)
[Ready-to-paste description following Area 4 specifications]

### 4-Week Google Posts Calendar

| Week | Post Type | Topic | CTA | Target Keyword |
|------|-----------|-------|-----|---------------|
| 1 | Project Highlight | [topic] | [cta] | [keyword] |
| 2 | Seasonal Tip | [topic] | [cta] | [keyword] |
| 3 | Customer Testimonial | [topic] | [cta] | [keyword] |
| 4 | Promotion/Event | [topic] | [cta] | [keyword] |

### Post Templates (ready to use)

**Week 1 Post:**
[Full post text with CTA and keyword]

**Week 2 Post:**
[Full post text with CTA and keyword]

**Week 3 Post:**
[Full post text with CTA and keyword]

**Week 4 Post:**
[Full post text with CTA and keyword]

### Q&A Seeds (15 entries)

| # | Question | Answer |
|---|----------|--------|
| 1 | [question] | [answer] |
| 2 | [question] | [answer] |
| ... | ... | ... |
| 15 | [question] | [answer] |

### Review Response Templates

**Positive Review (5 stars):**
[Template with personalization placeholders]

**Positive Review (4 stars):**
[Template with personalization placeholders]

**Negative Review (1-2 stars):**
[Template with de-escalation language and offline resolution offer]

**Neutral Review (3 stars):**
[Template acknowledging feedback with improvement commitment]

### Service Descriptions
[One description per service listed in Area 5, optimized with local keywords]
```

### Step 8: Technical Implementation Deliverables

Orchestrate **schema-markup-generator**, **on-page-seo-auditor**, and **technical-seo-checker** to produce:

```markdown
## Technical Implementation


```json
{
  "@context": "https://schema.org",
  "@type": "[specific LocalBusiness subtype]",
  "name": "[business name]",
  "description": "[business description]",
  "url": "[website url]",
  "telephone": "[phone]",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "[street]",
    "addressLocality": "[city]",
    "addressRegion": "[state]",
    "postalCode": "[zip]",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "[lat]",
    "longitude": "[lng]"
  },
  "openingHoursSpecification": [...],
  "areaServed": [...],
  "hasOfferCatalog": {...},
  "aggregateRating": {...},
  "sameAs": ["[gbp url]", "[social urls]"]
}
```

### Location Page Specifications

For each service area, create a page with:
- URL structure: /[service]-[city]/ or /locations/[city]/
- Unique H1: "[Service] in [City/Neighborhood]"
- 800-1200 words of unique content (no city-swap templates)
- Local landmarks, area-specific challenges, relevant testimonials
- Embedded Google Map, NAP block, and LocalBusiness schema
- Internal links to main service pages and other location pages

### Technical Audit Items
- [ ] Schema validates in Google Rich Results Test
- [ ] GBP data and schema data match exactly
- [ ] All location pages are indexed (check Search Console)
- [ ] Mobile page speed score 90+ (Core Web Vitals)
- [ ] SSL certificate active and valid
- [ ] No duplicate location pages or thin content flags
- [ ] Canonical tags set correctly on location pages
```

### Step 9: Monitoring and Reporting Setup

```markdown
## Monitoring & Reporting

### KPIs to Track

| KPI | Baseline | Target (90 days) | Measurement Tool |
|-----|----------|-------------------|-----------------|
| Overall GBP Score | [X]/100 | [X]/100 | Manual re-audit |
| Map Pack Rankings (primary keyword) | [position] | Top 3 | [rank tracker] |
| GBP Profile Views | [X]/month | [X]/month | GBP Insights |
| Direction Requests | [X]/month | [X]/month | GBP Insights |
| Phone Calls from GBP | [X]/month | [X]/month | GBP Insights |
| Website Clicks from GBP | [X]/month | [X]/month | GBP Insights |
| Review Count | [X] | [X] | GBP Dashboard |
| Average Rating | [X] | [X] | GBP Dashboard |
| Photo Views | [X]/month | [X]/month | GBP Insights |
| AI Overview Citations | [X] | [X] | Manual tracking |

### Reporting Cadence

- **Weekly**: Review responses, post publishing, message response times
- **Monthly**: Full KPI dashboard, engagement trends, competitor movement
- **Quarterly**: Re-audit scorecard, strategy adjustment, roadmap update

### Recommended Tool Stack

| Tool | Purpose | Cost Estimate |
|------|---------|--------------|
| BrightLocal | Rank tracking, citation audit, competitor monitoring | $39-79/mo |
| Whitespark | Citation building and cleanup | $20-60/mo |
| Podium or Birdeye | Review management and automation | $300-500/mo |
| Google Search Console | Organic performance, indexing | Free |
| GBP Insights | Profile performance metrics | Free |
| Semrush or Ahrefs | Keyword tracking, technical audits | $120-200/mo |
```

### Step 10: Client Deliverable Executive Summary

Produce a client-ready executive summary that leads with the overall score and top priorities:

```markdown
## Executive Summary: GBP Optimization -- [Business Name]

**Date**: [date]
**Prepared for**: [client name]
**Location**: [city, state]
**Overall GBP Score**: [X]/100

### Current State Assessment
[2-3 sentences summarizing the profile's current optimization level and key findings]

### Top 5 Priorities

| # | Priority | Impact | Effort | Timeline |
|---|----------|--------|--------|----------|
| 1 | [action] | High | [effort] | [time] |
| 2 | [action] | High | [effort] | [time] |
| 3 | [action] | Medium-High | [effort] | [time] |
| 4 | [action] | Medium | [effort] | [time] |
| 5 | [action] | Medium | [effort] | [time] |

### Projected Outcomes (90 days)
- Map Pack ranking improvement: [current] -> [target] for primary keyword
- GBP profile views increase: [X]% estimated
- Review velocity increase: [X] reviews/month -> [X] reviews/month
- Website traffic from GBP increase: [X]% estimated
- AI Overview visibility: [current state] -> [target state]

### Deliverables Checklist
- [ ] 16-area optimization scorecard with scores and status
- [ ] Area-by-area specifications with checklists and templates
- [ ] 4-phase implementation roadmap
- [ ] Optimized business description (750 chars, ready to paste)
- [ ] 4-week Google Posts calendar with full post text
- [ ] 15 Q&A seed entries
- [ ] Review response templates (positive, negative, neutral)
- [ ] Service descriptions optimized for local keywords
- [ ] LocalBusiness JSON-LD schema (ready to deploy)
- [ ] Location page specifications
- [ ] Technical audit checklist
- [ ] Monitoring KPIs with tool stack and costs
```

## Example

**User**: "Audit the GBP for Rapid Flow Plumbing in Austin, TX. They have 87 reviews at 4.3 stars, do residential and commercial plumbing, and their website is rapidflowplumbing.com."

**Output** (condensed):

```markdown
## GBP Optimization Scorecard: Rapid Flow Plumbing

**Location**: Austin, TX
**Overall Score**: 47/100

| # | Area | Score | Status |
|---|------|-------|--------|
| 1 | Primary & Secondary Categories | 6/10 | Primary "Plumber" is correct; missing "Water Heater Repair Service" and "Drain Cleaning Service" as secondaries |
| 2 | Service Area Configuration | 4/10 | Set to "Austin metro area" -- needs specific cities and neighborhoods |
| 3 | NAP Consistency | 3/10 | Phone number mismatch on Yelp and Angi; old address on BBB listing |
| 4 | Business Description | 5/10 | Generic description; missing primary keyword and differentiator |
| 5 | Services & Products | 4/10 | Only 3 services listed; no descriptions or pricing |
| 6 | Attributes | 3/10 | Only "wheelchair accessible" selected; missing emergency, licensed, free estimates |
| 7 | Photos | 5/10 | 34 photos; needs 66+ more across categories |
| 8 | Google Posts | 2/10 | Last post 3 months ago |
| 9 | Q&A | 2/10 | 1 unanswered question; no seeded FAQs |
| 10 | Messaging | 6/10 | Enabled but no automated after-hours response |
| 11 | Reviews | 6/10 | 87 reviews at 4.3; responding to ~60% |
| 12 | Website Backend | 5/10 | No LocalBusiness schema; no location pages |
| 13 | Local Content & Links | 4/10 | Blog exists but no local content |
| 14 | AI Overviews | 3/10 | No FAQ schema; not appearing in AI Overviews |
| 15 | Engagement Signals | 5/10 | Moderate click-to-call; low direction requests |
| 16 | Booking | 3/10 | No booking integration configured |

### Top 5 Priorities

| # | Priority | Impact | Timeline |
|---|----------|--------|----------|
| 1 | Fix NAP inconsistencies (phone on Yelp, address on BBB) | High | Week 1 |
| 2 | Add secondary categories: Water Heater Repair, Drain Cleaning | High | Week 1 |
| 3 | Implement Golden Hour review request workflow | High | Week 2 |
| 4 | Upload 66+ photos (job sites, team, vehicles, before/after) | Medium-High | Week 2-3 |
| 5 | Deploy LocalBusiness schema and build Austin neighborhood pages | Medium-High | Week 3-4 |

### Optimized Business Description (750 chars)
Rapid Flow Plumbing provides residential and commercial plumbing
services across Austin, TX and surrounding communities including
Round Rock, Cedar Park, and Pflugerville. Our licensed technicians
specialize in emergency repairs, drain cleaning, water heater
installation, slab leak detection, and whole-home repiping. With
same-day service, upfront pricing, and over 87 five-star reviews,
we are Austin's trusted plumbing team for both routine maintenance
and urgent repairs. Family-owned and operated, we bring more than
15 years of experience to every job. Call now for a free estimate
or book online for next-day service.
```

## Tips for Success

1. **Validate categories against Google's actual list** -- custom categories are not supported; always verify that recommended categories exist in Google's predefined set before suggesting them
2. **NAP consistency is the highest-ROI fix for most businesses** -- even small mismatches (suite numbers, abbreviations, phone formatting) erode trust signals; prioritize this in every audit
3. **City-swap templates are penalized** -- every location page must have genuinely unique content; duplicating a page and swapping the city name creates thin content flags and ranking suppression
4. **Geotagging EXIF data in photos is debunked as a ranking factor** -- do not recommend geotagging tools; focus on photo quality, quantity (100+), variety, and descriptive filenames instead
5. **The Q&A API was deprecated in November 2025** -- do not recommend programmatic Q&A seeding; all Q&A management is now manual through the GBP interface, and Gemini is replacing traditional Q&A with AI-generated answers
6. **Engagement metrics are weighted more heavily in 2026** -- direction requests, click-to-call, saves, and shares directly influence Map Pack ranking; optimize calls-to-action accordingly
7. **Choose the right mode for the request** -- a client asking "how's my profile?" needs an audit, not a full plan; mode detection in Step 1 prevents over-delivering or under-delivering
8. **Review response speed is now tracked** -- Google measures how quickly businesses respond to reviews; aim for same-day responses and use templates to maintain speed at scale
9. **Re-audit quarterly** -- GBP optimization is not a one-time project; competitor movement, algorithm updates, and seasonal changes require regular re-scoring
10. **Lead with the executive summary** -- clients and stakeholders read the overall score and top 5 priorities first; put the detailed specifications in appendices or follow-up sections

## Related Skills

- [keyword-research](../research/keyword-research/) - Local keyword discovery and category-keyword mapping
- [serp-analysis](../research/serp-analysis/) - Map Pack trigger analysis and AI Overview detection
- [competitor-analysis](../research/competitor-analysis/) - GBP competitor benchmarking and gap identification
- [seo-content-writer](../build/seo-content-writer/) - GBP post writing, business descriptions, and Q&A content
- [schema-markup-generator](../build/schema-markup-generator/) - LocalBusiness JSON-LD generation
- [on-page-seo-auditor](../optimize/on-page-seo-auditor/) - Location page on-page optimization
- [technical-seo-checker](../optimize/technical-seo-checker/) - Website technical audit for GBP backend
- [rank-tracker](../monitor/rank-tracker/) - Map Pack and AI Overview ranking monitoring
- [performance-reporter](../monitor/performance-reporter/) - GBP performance reporting and KPI tracking
