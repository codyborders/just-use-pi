---
name: godaddy-domain-search
description: Analyzes domain names for monetization potential across flipping, affiliate, lead gen, content, SaaS, parking, local business, and ecommerce strategies. Uses web search to gather market data, GoDaddy auction information, comparable sales, and domain appraisals. Chains keyword-research, competitor-analysis, and serp-analysis skills. Accepts single domains, comma-separated lists, or CSV files.
---

# GoDaddy Domain Search

This skill orchestrates a full domain monetization analysis workflow -- from input parsing through web research, AI-driven strategy scoring, and SEO research chaining. It produces comprehensive markdown reports with investment recommendations, monetization strategies, and market intelligence for each domain analyzed.

## When to Use This Skill

- Evaluating a single domain purchase for monetization potential
- Batch-analyzing a portfolio of domains from a CSV file
- Comparing monetization strategies across multiple domains
- Deciding whether to hold, develop, or flip a domain
- Planning content or business strategy for an acquired domain
- Researching domain auction opportunities on GoDaddy
- Assessing domain resale value against comparable sales

## What This Skill Does

1. **Input Parsing**: Accepts single domains, comma-separated lists, CSV files, or direct GoDaddy auction URLs
2. **Linguistic Analysis**: Segments domain names into keywords, classifies niches, scores brandability and memorability
3. **Web Research**: Uses web search to gather GoDaddy auction data, estimated values, comparable sales, domain age, parking stats, and market intelligence
4. **API Enrichment (optional)**: Falls back to GoDaddy API for availability and appraisal data
5. **Eight-Strategy Monetization Scoring**: Evaluates each domain across flipping, affiliate, lead gen, content, SaaS, parking, local business, and ecommerce
6. **SEO Research Chaining**: Orchestrates keyword-research, competitor-analysis, and serp-analysis skills for market intelligence
7. **Report Generation**: Produces comprehensive markdown reports saved to `~/projects/domain-research/`
8. **Portfolio Comparison**: For multi-domain inputs, generates a ranked comparison with investment recommendations

## How to Use

### Single Domain

```
/godaddy-domain-search fitnessgear.com
```

### Multiple Domains

```
/godaddy-domain-search fitnessgear.com, healthpills.net, yogamat.store
```

### CSV File

```
/godaddy-domain-search ~/domains/portfolio.csv
```

### Direct Auction URL

```
/godaddy-domain-search https://www.godaddy.com/domain-auctions/campingsouthwest-com-696870289
```

## Instructions

When a user requests domain monetization analysis:

### Step 1: Parse Input and Validate Domains

Determine the input format and extract a validated list of domains.

**Single domain**: Argument matches the pattern `[a-zA-Z0-9-]+\.[a-zA-Z]{2,}` (e.g., `fitnessgear.com`).

**GoDaddy auction URL**: Argument starts with `https://www.godaddy.com/domain-auctions/`. Extract the domain name from the URL path -- the path segment follows the pattern `{domain-with-tld-hyphenated}-{numeric-id}`. For example, `campingsouthwest-com-696870289` yields `campingsouthwest.com`. Save the full auction URL for direct reference in Step 3.

**Comma-separated list**: Split on commas, trim whitespace, validate each entry as a domain.

**CSV file**: Check if the argument ends in `.csv` and the file exists. Read the file using the Read tool. Look for a column header named `domain`, `Domain`, `url`, `URL`, `name`, or `Name`. If no recognizable header exists, treat the first column as domains. Strip `http://`, `https://`, and `www.` prefixes from each value.

For each domain, extract and store:
- The bare domain name without TLD (e.g., `campingsouthwest`)
- The TLD (e.g., `.com`)
- Hyphen-separated keyword segments (e.g., `camping-southwest` -> `camping`, `southwest`)
- Recognizable dictionary words within compound names (e.g., `campingsouthwest` -> `camping`, `southwest`)

Report any malformed entries to the user and proceed with the valid domains.

### Step 2: Domain Name Linguistic Analysis

For each validated domain, perform AI-driven analysis of the domain name itself:

**Keyword Extraction**: Segment compound domain names into constituent keywords. For example, `fitnessgear` becomes `fitness` + `gear`. Hyphenated domains split naturally. Identify all meaningful keywords embedded in the name.

**Niche Classification**: Categorize the domain into a primary niche and up to two secondary niches based on the extracted keywords. Use specific categories (e.g., "Outdoor Recreation / Camping" rather than just "Travel").

**Brandability Score (1-10)**: Evaluate based on:
- Length (shorter is better; under 15 characters is ideal)
- Ease of spelling and pronunciation
- Memorability and uniqueness
- Positive associations
- Absence of trademark conflicts with major brands

**TLD Value Assessment**: Score the TLD's commercial value:
- `.com` = premium (highest trust, broadest use)
- `.net`, `.org` = solid (established credibility)
- `.io` = tech credibility
- `.store`, `.shop` = ecommerce signal
- `.co` = startup appeal
- Country codes = geo-targeting value

**Length Assessment**: Character count and word count. Note that domains under 8 characters are premium, under 15 are good, over 20 are long.

**Memorability Score (1-10)**: How easily someone remembers and types this domain after hearing it once.

**Trademark Risk Flag**: Low / Medium / High based on whether the keywords overlap with known major brands or trademarked terms.

Record all analysis in a structured format for inclusion in the report.

### Step 3: Web Research for GoDaddy Market Data

Use web search to gather GoDaddy auction data and market intelligence. This provides comparable sales data, parking statistics, and auction-specific details that inform monetization strategies.

For each domain, perform these searches:

**a. GoDaddy auction search**: Search for `site:godaddy.com domain auction {domain}` to find auction listings

**b. Domain appraisal research**: Search for `{domain} domain value appraisal` or `{domain} godaddy govalue estimate`

**c. Comparable sales research**: Search for `{keyword} domain sold price` or `{domain TLD} domain sales comparable` to find recent sales data for similar domains

**d. Parking and traffic data**: Search for `{domain} domain parking revenue` or `{domain} traffic statistics`

**e. WHOIS and age information**: Use web search to find domain age and registration history

**f. Market intelligence**: Search for `{niche} domain market trends` or `{keyword} domain investment value`

Rate limiting for batch processing: Wait 2-3 seconds between searches to avoid rate limits.

### Step 3b: GoDaddy API Enrichment (Optional Fallback)

If web research is insufficient, attempt API-based enrichment.

Check the `.env` file in the current working directory for `GODADDY_API_KEY` and `GODADDY_API_SECRET`. If both exist, run:

```bash
python3 {SKILL_DIR}/scripts/godaddy_api.py --domains "domain1.com,domain2.com" --env-file .env
```

The script queries:
1. Domain Availability (`/v1/domains/available`) -- whether the domain is registered or available
2. Domain Appraisal (`/v1/appraisal/{domain}`) -- GoDaddy's estimated value (GoValue)

Parse the JSON output and integrate into the domain profile.

If neither web search nor API data is available, note in the report: "GoDaddy market data unavailable. Analysis based on AI assessment of domain name only. Set GODADDY_API_KEY and GODADDY_API_SECRET in .env, or ensure web search is available, for enriched data."

### Step 4: Eight-Strategy Monetization Analysis

For each domain, analyze monetization potential across all eight strategies. Incorporate any gathered market data (estimated value, comparable sales, domain age, parking stats) where available to ground the analysis in market reality.

Each strategy receives:
- **Viability Score** (1-10): How suitable the domain is for this strategy
- **Revenue Potential**: Estimated $/month range at maturity
- **Implementation Difficulty**: Easy / Medium / Hard
- **Time to Revenue**: Immediate / 1-3 months / 3-6 months / 6-12 months
- **Actionable Ideas**: 2-3 specific ideas for executing this strategy
- **Key Considerations**: Risks, requirements, and success factors

**Strategy 1: Domain Flipping / Resale**

Evaluate resale potential using:
- Researched estimated value as baseline
- Comparable sales data from web research (adjust for keyword relevance, TLD match, length similarity)
- Domain age (older domains command premium pricing due to perceived authority)
- Keyword commercial value (high-CPC keywords indicate higher domain value)
- TLD and length premiums

Suggest listing marketplaces: Afternic, Sedo, GoDaddy Auctions, Dan.com, Squadhelp.

**Strategy 2: Affiliate Site**

Identify affiliate programs matching the domain's niche:
- Amazon Associates for product-related domains
- ShareASale, CJ Affiliate, Impact for niche programs
- Niche-specific programs (e.g., REI affiliate for outdoor domains, Booking.com for travel)
- Suggest 2-3 specific content angles that align keywords to high-converting affiliate offers

**Strategy 3: Lead Generation**

Identify industries where the domain could generate leads:
- Local service businesses matching the domain's keywords
- B2B verticals where leads have high value
- Estimate lead value by industry (e.g., roofing leads $50-200, legal leads $100-500)
- Suggest lead capture mechanisms: contact forms, quote calculators, call tracking

**Strategy 4: Content / Blog Site**

Assess content opportunity:
- Estimate content universe size (how many articles could this niche sustain?)
- Identify content pillars aligned with the domain keywords
- Ad monetization path: traffic thresholds for Mediavine (50K sessions/month) and AdThrive (100K pageviews/month)
- Alternative monetization: sponsored content, email newsletter, digital products

**Strategy 5: SaaS Landing Page**

Evaluate software product naming fit:
- Does the domain name suggest a software product or service?
- Could it serve as a brand name for a SaaS tool?
- Suggest 1-2 SaaS concepts that match the domain's keywords
- Assess naming-product fit on a qualitative scale

**Strategy 6: Domain Parking**

Estimate parking revenue:
- Use any available parking stats from web research
- Estimate based on keyword CPC and type-in traffic potential
- Suggest parking providers: Sedo, ParkingCrew, Bodis, GoDaddy CashParking
- Note: parking is lowest-effort but typically lowest-return; best as a holding strategy

**Strategy 7: Local Business Site**

Assess local business potential:
- Identify geo-keywords in the domain (city names, region names, "near me" signals)
- Identify service keywords that map to local businesses
- Estimate local SEO advantage from exact-match or partial-match domain
- Suggest specific local business types that would benefit from this domain

**Strategy 8: E-commerce**

Evaluate product selling potential:
- Does the domain name suggest a product category or brand?
- Dropshipping viability for the niche
- Branded product or private label potential
- Domain trust signal assessment for e-commerce (length, TLD, brandability)
- Platform suggestions: Shopify, WooCommerce, BigCommerce

### Step 5: Strategy Ranking

Produce a ranked summary of all eight strategies.

Calculate a composite score for each strategy:
```
composite_score = (viability * revenue_weight) / difficulty_weight
```

Where:
- `revenue_weight`: Low=1, Medium=2, High=3
- `difficulty_weight`: Easy=1, Medium=2, Hard=3

Factor in domain-specific advantages:
- Domain age over 10 years: boost content and SEO-dependent strategies by +1
- Estimated value over $1,000: boost flipping strategy by +1
- Parking stats showing traffic: boost parking and content strategies by +1
- Geo keywords present: boost local business strategy by +2

Present as a ranked table with the top 2-3 strategies highlighted and a brief rationale for why they are the best fit for this specific domain.

### Step 6: SEO Research Chaining

After completing the monetization analysis, orchestrate three existing SEO skills to provide market intelligence that validates and enriches the monetization recommendations.

**Orchestrate keyword-research**: Invoke the `keyword-research` skill with:
- Seed terms: the extracted keywords from the domain name
- Target audience: derived from the niche classification in Step 2
- Business goal: aligned with the top-ranked monetization strategy
- Include the domain's niche context so the keyword research is focused

Capture the keyword research output. Summarize the top 10-15 keyword opportunities in the report, noting search volume, difficulty, and intent.

**Orchestrate competitor-analysis**: Invoke the `competitor-analysis` skill to:
- Analyze the top 3-5 existing sites in the domain's identified niche
- Focus on their content strategies, traffic estimates, and monetization approaches
- Identify gaps that the analyzed domain could exploit

Capture the competitive intelligence. Summarize key competitors, their strengths, and exploitable gaps in the report.

**Orchestrate serp-analysis**: Invoke the `serp-analysis` skill for:
- The top 3-5 target keywords identified in the keyword research phase
- Analyze SERP difficulty, feature opportunities (featured snippets, People Also Ask), and AI Overview presence

Capture the SERP landscape findings. Summarize difficulty scores, feature opportunities, and recommended content formats in the report.

**Batch processing rule**: For inputs with more than 5 domains, run SEO research chaining only for the top 3 domains ranked by overall monetization potential. Note in the report that other domains can be analyzed individually with a separate invocation.

### Step 7: Generate and Save Report

Create the output directory and write reports.

**Directory structure**:
```
~/projects/domain-research/
├── index.md                           # Portfolio summary (multi-domain only)
├── campingsouthwest-com/
│   └── report.md                      # Full report for campingsouthwest.com
├── fitnessgear-com/
│   └── report.md
└── yogamat-store/
    └── report.md
```

**Per-domain report**: Follow the template from `{SKILL_DIR}/assets/report-template.md`. Fill in all sections with the data gathered in Steps 1-6. Use the Write tool to save each report.

**Portfolio index** (multi-domain only): Create `~/projects/domain-research/index.md` with a comparison table of all domains showing:
- Domain name
- Estimated value (if available)
- Domain age
- Top monetization strategy
- Composite score
- Investment recommendation (Buy / Skip / Watch)

After saving all reports, inform the user of the output location and provide a brief summary of the top findings.

### Step 8: Portfolio Summary (Multi-Domain Only)

For inputs with 2 or more domains, produce a portfolio-level analysis:

**Side-by-side comparison table**: All domains ranked by overall monetization potential with their top strategy, estimated value, and composite score.

**Investment recommendations**: For each domain:
- **Buy**: Strong monetization potential, favorable valuation, clear strategy path
- **Skip**: Poor keyword value, high acquisition cost relative to potential, saturated niche
- **Watch**: Moderate potential, wait for price drop or market shift

**Budget allocation**: If the user were to invest in a subset, recommend which domains to prioritize and why.

## Example

**User**: `/godaddy-domain-search https://www.godaddy.com/domain-auctions/campingsouthwest-com-696870289`

**Workflow** (condensed):

1. Parse auction URL -> extract `campingsouthwest.com`
2. Linguistic analysis -> keywords: `camping`, `southwest`; niche: Outdoor Recreation / Camping; brandability: 6/10
3. Web research -> search for auction data, comparable sales ($100-$2,695 range), domain age 20 years
4. Eight-strategy analysis -> top strategies: Content/Blog (8/10), Affiliate (7/10), Lead Gen (6/10)
5. Strategy ranking -> Content site recommended due to strong keywords + 20-year domain age
6. SEO chaining -> keyword research finds "camping southwest USA" (1,900 vol), "southwest camping spots" (880 vol); competitor analysis reveals content gaps in Southwest camping guides; SERP analysis shows featured snippet opportunities
7. Report saved to `~/projects/domain-research/campingsouthwest-com/report.md`

## Tips for Success

1. **Use web search for market intelligence** -- Searching for comparable domain sales and auction data provides real market context for valuations.
2. **Rate limit batch processing** -- When analyzing more than 3 domains, allow 2-3 seconds between searches to avoid triggering rate limits.
3. **Domain age matters for SEO strategies** -- Domains over 10 years old have significant SEO authority potential. Weight content, affiliate, and lead gen strategies higher for aged domains.
4. **Comparable sales ground valuations** -- Web research for similar domain sales provides real market data. Use these to calibrate flipping estimates rather than relying solely on appraisals.
5. **CSV format flexibility** -- When preparing CSV files, include a `domain` column header for reliable parsing. One domain per row, no protocol prefixes needed.
6. **SEO chaining depth** -- The three chained SEO skills produce substantial output. For large portfolios, the skill limits deep analysis to the top 3 domains. Run individual analyses for other domains of interest.
7. **API fallback** -- If web search doesn't yield sufficient data, the GoDaddy API script provides structured availability and appraisal data. Ensure `.env` has `GODADDY_API_KEY` and `GODADDY_API_SECRET`.
8. **Auction URLs are the fastest path** -- When evaluating a specific auction listing, pass the full GoDaddy auction URL directly to help focus the web research.

## Related Skills

- [keyword-research](../keyword-research/) -- Discovers keywords derived from domain name for content and SEO strategy
- [competitor-analysis](../competitor-analysis/) -- Analyzes existing sites in the domain's niche for competitive intelligence
- [serp-analysis](../serp-analysis/) -- Evaluates SERP difficulty and feature opportunities for target keywords
- [seo-content-writer](../seo-content-writer/) -- Creates optimized content once a content strategy is chosen
- [rank-tracker](../rank-tracker/) -- Tracks keyword rankings after launching a site on the domain
- [websearch](../websearch/) -- Used for gathering market data and comparable sales information
