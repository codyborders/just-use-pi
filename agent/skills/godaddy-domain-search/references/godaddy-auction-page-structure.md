# GoDaddy Auction Page Structure

Reference for extracting data from GoDaddy auction pages using Claude for Chrome accessibility tree.

## URL Patterns

### Direct Auction Page

```
https://www.godaddy.com/domain-auctions/{domain-slug}-{auction-id}
```

Example: `https://www.godaddy.com/domain-auctions/campingsouthwest-com-696870289`

The domain slug replaces dots with hyphens. The numeric auction ID follows the last hyphen.

To reconstruct the domain from the slug: the TLD is the last segment before the auction ID. For `campingsouthwest-com-696870289`, the domain is `campingsouthwest.com`.

### Auction Search

```
https://auctions.godaddy.com/trpSearchResults.aspx?searchfield={domain}
```

### Domain Search (redirects to results)

```
https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck={domain}
```

## Page Layout (Accessibility Tree)

The auction detail page has a `main` element containing all domain data. Here is the element hierarchy with the labels to search for:

### Header Section

```
main
 generic "Ends at {date} {time} ({timezone})"    # Auction end datetime
  generic "{Xd Xh left}"                          # Countdown timer
 table
  heading "{domain.com}"                           # Domain name
 button > generic "Watchlist"                      # Watchlist toggle
```

### Pricing Section

```
 generic "Current bid"                             # Bid label
 generic "USD"                                     # Currency
 generic "(+$XX.XX USD /yr renewal"                # Annual renewal cost
 form                                              # Bid form
  generic "Your bid"
  textbox "{minimum bid}"                          # Current minimum bid amount
  button > generic "Place Bid"
```

### Stats Section

```
 generic "Visits"                                  # Visit count label (value may be nearby)
 generic "Estimated Value"                         # Appraisal label
 generic "${X,XXX}"                                # Dollar amount
 generic "USD"                                     # Currency
```

### Bid History

```
 table > generic "Bid History"
 heading "No Activity"                             # If no bids yet
```

### Details Section

```
 heading "Details"
 generic "About"
 image "example logo"                              # Domain logo/preview
 generic "{long description text}"                 # AI-generated domain description (truncated)
 generic "Upper case"
 generic "{DOMAIN.COM}"                            # Uppercase display
 generic "Inventory type"
 generic "{Expired Auctions | Buy Now | ...}"      # Auction type
 generic "Age"
 generic "{XX years}"                              # Years
 generic "{X months}"                              # Months
 generic "Earliest known creation date"
 generic "{Month DD, YYYY}"                        # Creation date
 generic "Delivery time"
 generic "Take ownership in {X} days"              # Transfer time
```

### Appraisal Section

```
 heading "Appraisal"
 generic "Estimated Value"
 generic "${X,XXX}"                                # GoValue amount
 generic "USD"
 table                                             # Comparable sales table
  generic "Comparable domains sold"                # Table header
  generic "Price (USD)"                            # Price column header
  generic "{domain1.com}"                          # Comparable domain name
  generic "${XXX}"                                 # Sale price
  generic "{domain2.com}"                          # Next comparable
  generic "${XXX}"                                 # Next price
  ...                                              # More pairs follow
```

### Parking Statistics Section

```
 heading "Parking Statistics"
 generic "Estimated monthly pageviews"
 generic "{X,XXX | Not Available}"                 # Monthly traffic
 generic "Estimated monthly revenue"
 generic "{$XX | Not Available}"                   # Monthly parking revenue
```

### Research Links

```
 heading "Research Domain"
 generic "Search by SLD:"
 link "Google" href="https://www.google.com/search?q={sld}"
 link "Baidu" href="..."
 link "Yahoo" href="..."
 link "Wikipedia" href="..."
 generic "Search by domain:"
 link "{domain.com}" href="http://{domain.com}"
 link "archive.org" href="https://web.archive.org/web/*/{domain.com}"
 link "WHOIS" href="/whois/results.aspx?..."
```

## Extraction Strategy

When reading the page with `mcp__claude-in-chrome__read_page`:

1. Set `depth: 10` for adequate detail without excessive output.
2. Look for the `main` element and scan its children sequentially.
3. Match labels by their text content (e.g., `"Estimated Value"`, `"Age"`, `"Comparable domains sold"`).
4. Values immediately follow their labels in the tree as sibling generic elements.
5. Comparable sales alternate between domain names and prices in the table structure.

## Common Page States

| State | Indicators |
|-------|-----------|
| Active Auction | Countdown timer visible, bid form present, "Current bid" shown |
| Expired / Sold | No countdown, may show "Auction Ended" or redirect |
| Buy Now | "Buy Now" button instead of bid form, fixed price shown |
| Make Offer | "Make Offer" button, no fixed price |
| Domain Not Found | Search results page with no matching auction |

## Data Extraction Checklist

For each domain auction page, extract:

- [ ] Domain name (from heading)
- [ ] Estimated Value and currency
- [ ] Domain age (years + months)
- [ ] Earliest creation date
- [ ] Inventory type
- [ ] Current bid amount (if auction)
- [ ] Time remaining (if auction)
- [ ] Comparable domains sold with prices (all pairs from table)
- [ ] Parking pageviews (or "Not Available")
- [ ] Parking revenue (or "Not Available")
- [ ] Delivery time
- [ ] Domain description text
- [ ] Annual renewal cost
