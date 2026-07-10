# GoDaddy API Reference

Concise reference for the two GoDaddy endpoints used by the domain search skill.

## Authentication

All requests require the `Authorization` header:

```
Authorization: sso-key {API_KEY}:{API_SECRET}
```

Obtain credentials at https://developer.godaddy.com/keys -- create a "Production" key pair.

## Base URL

```
https://api.godaddy.com
```

## Endpoints

### Domain Availability

Check whether a domain is registered or available for purchase.

**Request**:
```
GET /v1/domains/available?domain={domain}&checkType=FAST&forTransfer=false
```

**Response** (200 OK):
```json
{
  "available": true,
  "domain": "example.com",
  "definitive": true,
  "price": 1199,
  "currency": "USD",
  "period": 1
}
```

- `available`: whether the domain can be registered
- `definitive`: if `false`, the result is a fast estimate (recheck with `checkType=FULL` for certainty)
- `price`: registration price in minor units (1199 = $11.99)

### Domain Appraisal

Get GoDaddy's estimated market value (GoValue) for a domain.

**Request**:
```
GET /v1/appraisal/{domain}
```

**Response** (200 OK):
```json
{
  "domain": "example.com",
  "govalue": 2847,
  "comparable": [
    {"domain": "similar.com", "price": 1500},
    {"domain": "related.com", "price": 3200}
  ]
}
```

- `govalue`: estimated market value in USD
- `comparable`: list of similar domains with known sale prices (may be empty)

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Domain Availability | 60 requests / minute |
| Domain Appraisal | 20 requests / minute |

When rate limited, the API returns HTTP 429. The `godaddy_api.py` script uses a configurable `--batch-delay` (default 3 seconds) between domains to stay within limits.

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 401 | Invalid or expired credentials | Verify API key and secret in .env |
| 404 | Domain not found for appraisal | Domain has no GoValue data; skip appraisal |
| 422 | Invalid domain format | Check domain string for typos or invalid TLD |
| 429 | Rate limit exceeded | Increase --batch-delay or wait before retrying |

## Environment Variables

Add to `.env` in the project root:

```
GODADDY_API_KEY=your_api_key_here
GODADDY_API_SECRET=your_api_secret_here
```

Both values come from the GoDaddy Developer Portal key management page.
