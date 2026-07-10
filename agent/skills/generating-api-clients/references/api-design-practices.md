# API Design Best Practices

Consolidated reference from industry-standard guides: Vinay Sahni's Pragmatic REST API Guide, Microsoft REST API Guidelines, Heroku HTTP API Design Guide, and GitGuardian API Security Best Practices.

## URL Structure and Naming

- Use nouns for resources, not verbs: `/users`, `/orders`, not `/getUsers`
- Use plural nouns for collections: `/users`, not `/user`
- Nest resources to show relationships: `/users/{id}/orders`
- Keep URLs max 2 levels deep; flatten beyond that with query filters
- Use kebab-case in URLs: `/user-profiles`, not `/userProfiles`
- Version via URL prefix: `/v1/users` (preferred) or via `Accept` header

## HTTP Methods

| Method | Purpose | Idempotent | Safe |
|---|---|---|---|
| GET | Retrieve resource(s) | Yes | Yes |
| POST | Create a resource | No | No |
| PUT | Full replacement of resource | Yes | No |
| PATCH | Partial update of resource | No | No |
| DELETE | Remove a resource | Yes | No |

- POST returns 201 with `Location` header pointing to created resource
- PUT/PATCH return 200 with updated resource
- DELETE returns 204 with no body
- Use POST for actions that do not map to CRUD: `POST /users/{id}/activate`

## Status Codes

### Success Codes
- **200 OK** -- Standard success for GET, PUT, PATCH
- **201 Created** -- Resource created (POST); include `Location` header
- **204 No Content** -- Success with no body (DELETE, some PUT)

### Client Error Codes
- **400 Bad Request** -- Malformed request syntax or invalid parameters
- **401 Unauthorized** -- Missing or invalid authentication credentials
- **403 Forbidden** -- Valid credentials, insufficient permissions
- **404 Not Found** -- Resource does not exist
- **409 Conflict** -- State conflict (e.g., duplicate creation)
- **422 Unprocessable Entity** -- Valid syntax but semantic validation failed
- **429 Too Many Requests** -- Rate limit exceeded; include `Retry-After` header

### Server Error Codes
- **500 Internal Server Error** -- Unexpected server failure
- **502 Bad Gateway** -- Upstream service failure
- **503 Service Unavailable** -- Temporary overload; include `Retry-After`
- **504 Gateway Timeout** -- Upstream service timeout

## Error Response Format

Use a consistent error envelope. The JSend / RFC 7807 style:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Human-readable summary of the error.",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address."
      }
    ]
  }
}
```

- Always include a machine-readable `code` and a human-readable `message`
- Include `details` array for validation errors with per-field messages
- Never expose stack traces, internal paths, or SQL in error responses

## Authentication

### Common Patterns

**API Key** -- Passed in header (`X-API-Key`) or query param. Simple but less secure.

**Bearer Token** -- `Authorization: Bearer <token>`. Standard for OAuth2 access tokens.

**OAuth2** -- Authorization Code flow for user-facing apps; Client Credentials for server-to-server. Always use PKCE for public clients.

**JWT** -- Self-contained tokens with expiry. Verify signature and expiry on every request. Refresh tokens should be opaque, not JWT.

### Security Rules
- Always use HTTPS
- Never send credentials in URL query strings in production
- Rotate API keys and tokens regularly
- Use short-lived access tokens with refresh tokens
- Store secrets in environment variables, never in code

## Pagination

### Cursor-Based (Preferred)

```
GET /users?cursor=abc123&limit=25

Response:
{
  "data": [...],
  "pagination": {
    "next_cursor": "def456",
    "has_more": true
  }
}
```

- Most scalable; stable under concurrent writes
- Client passes `cursor` from previous response
- When `has_more` is false or `next_cursor` is null, stop

### Offset-Based

```
GET /users?offset=50&limit=25

Response:
{
  "data": [...],
  "pagination": {
    "total": 243,
    "offset": 50,
    "limit": 25
  }
}
```

- Simpler but unstable if data changes between pages
- Usable for smaller datasets

### Link Header (RFC 8288)

```
Link: <https://api.example.com/users?page=3>; rel="next",
      <https://api.example.com/users?page=50>; rel="last"
```

- Standard HTTP mechanism; used by GitHub API
- Parse `rel="next"` to find next page URL

## Rate Limiting

APIs should communicate limits via response headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 998
X-RateLimit-Reset: 1672531200
```

- `Limit`: Maximum requests per window
- `Remaining`: Requests left in current window
- `Reset`: Unix timestamp when the window resets

Client behavior on 429:
1. Read `Retry-After` header (seconds or HTTP-date)
2. Fall back to `X-RateLimit-Reset` if no `Retry-After`
3. Sleep until the reset time
4. Log the rate-limit event

## Caching

### ETag / If-None-Match

```
# First request
GET /users/123
Response: ETag: "abc123"

# Subsequent request
GET /users/123
If-None-Match: "abc123"
Response: 304 Not Modified (no body)
```

### Last-Modified / If-Modified-Since

```
# First request
GET /users/123
Response: Last-Modified: Mon, 01 Jan 2024 00:00:00 GMT

# Subsequent request
GET /users/123
If-Modified-Since: Mon, 01 Jan 2024 00:00:00 GMT
Response: 304 Not Modified
```

- Cache the full response body locally
- On 304, return the cached body
- On 200, update the cache with new body and headers

## Filtering, Sorting, and Field Selection

### Filtering
- Use query parameters for simple filters: `GET /users?status=active&role=admin`
- For complex filters, use a dedicated parameter: `GET /users?filter=age>25`

### Sorting
- Use `sort` parameter with field names: `GET /users?sort=created_at`
- Prefix with `-` for descending: `GET /users?sort=-created_at`
- Multiple fields: `GET /users?sort=-created_at,name`

### Field Selection
- Use `fields` parameter to reduce payload: `GET /users?fields=id,name,email`
- Reduces bandwidth and improves performance

## Request and Response Conventions

- Use JSON as the default content type (`Content-Type: application/json`)
- Use camelCase for JSON keys in responses (API convention) but snake_case in Python client code
- Wrap collections in an object: `{"data": [...], "pagination": {...}}` -- never return bare arrays
- Include `created_at` and `updated_at` timestamps in ISO 8601 format with timezone
- Use UUIDs or opaque strings for resource IDs; avoid exposing sequential integers

## Idempotency

- Support `Idempotency-Key` header for POST requests to prevent duplicate creation
- Store the key-to-response mapping server-side
- Return the stored response for duplicate keys without re-executing

## Versioning

- **URL path versioning** (`/v1/users`): Most common, easy to understand
- **Header versioning** (`Accept: application/vnd.api+json;version=1`): Cleaner URLs
- Never break backward compatibility within a version
- Deprecate old versions with `Sunset` header and advance notice
