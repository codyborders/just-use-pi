---
name: generating-api-clients
description: Generates production-quality Python API client libraries from OpenAPI specs or freeform API descriptions. Configurable components include authentication, pagination, rate limiting, retry logic, caching, error handling, and tests. This skill should be used when creating API wrappers, SDK clients, or service integrations in Python.
---

# Generating API Clients

## Overview

Generate a production-quality Python API client from an OpenAPI or Swagger specification or from a freeform API description. Use `httpx` for HTTP and `pydantic` for models. Expose resources through interfaces such as `client.users.list()`. Authentication and every optional component can be enabled independently.

## Quick Start

### From an OpenAPI Spec

```
User: "Generate a Python client for this API" + provides openapi.json/yaml
```

Parse the specification, then identify its endpoints and schemas. Record authentication and pagination behaviour. Confirm the components to enable, using the defaults below when the user has no preference. Scaffold the project and generate the selected code.

### From a Freeform Description

```
User: "Build a client for the Acme API; it uses Bearer auth, has /users and /orders endpoints, with cursor-based pagination"
```

Extract the endpoints and base URL from the description. Determine the authentication type and pagination style. Ask for missing details, confirm the component selection, then scaffold and generate the client.

## Component Selection

Before generation, confirm which components to include. Present this table and use the indicated defaults.

| Component | Description | Default |
|---|---|---|
| Authentication | API key, OAuth2, JWT, Bearer token handlers | ON |
| Error handling | Custom exception hierarchy, status code mapping | ON |
| Pagination | Cursor, offset, or Link-header auto-pagination | ON |
| Pydantic models | Typed request/response models | ON |
| Test suite | pytest fixtures, mock responses, basic coverage | ON |
| Documentation | Docstrings, README with usage examples | ON |
| Rate limiting | X-Rate-Limit header parsing, backoff | OFF |
| Retry logic | Exponential backoff with jitter, configurable | OFF |
| Caching | ETag / Last-Modified / If-None-Match support | OFF |
| Async support | httpx async client alongside sync client | OFF |

Honor explicit choices. Otherwise, use the defaults and confirm them before proceeding.

## Generation Workflow

### Step 1: Gather Input

For an OpenAPI specification, read the base URL and API version. Parse authentication from `securityDefinitions` or `components.securitySchemes`. Enumerate every path with its HTTP method. Capture parameters and request or response schemas. Detect cursor and offset parameters, along with Link headers, to infer pagination.

For a freeform description, extract the base URL, authentication type, endpoint methods, and parameters. Ask for the base URL or authentication type when either is missing. When the API returns collections, ask which pagination style it uses.

### Step 2: Scaffold the Project

Run the scaffold script with flags that match the selected components.

```bash
python3 {SKILL_DIR}/scripts/scaffold_client.py <client_name> --output <target_dir> \
  --auth --errors --pagination --models --tests --docs \
  [--rate-limit] [--retry] [--cache] [--async]
```

The script creates the directory tree and placeholder files.

### Step 3: Generate the Core Client

Read `{SKILL_DIR}/references/client-patterns.md` for templates. Generate `client.py` with a `Client` class that accepts `base_url` and `timeout`. It must also accept either `api_key` or `token`. Create an internal `httpx.Client` with default headers.

Implement `_request()` plus `_get()`, `_post()`, `_put()`, `_patch()`, and `_delete()`. The request method must compose all enabled authentication, retry, rate-limit, and cache middleware. Add `close()` and support the `__enter__` and `__exit__` context manager methods.

### Step 4: Generate Selected Components

Read the corresponding section of `{SKILL_DIR}/references/client-patterns.md` before generating each selected component.

#### Authentication (`auth.py`)

Implement authentication handlers with an `apply(request)` method. Use `APIKeyAuth` for API keys and `BearerAuth` for bearer tokens. Provide separate `OAuth2Auth` and `JWTAuth` handlers for those protocols. Pass a handler into the client constructor and apply it inside `_request()`.

#### Error Handling (`exceptions.py`)

Define `APIError` with `status_code`, `message`, and `response` attributes. Add `AuthenticationError` for 401, `ForbiddenError` for 403, `NotFoundError` for 404, `ValidationError` for 422, `RateLimitError` for 429, and `ServerError` for 5xx responses. Map response status codes inside `_request()`.

#### Pagination (`pagination.py`)

Create an `auto_paginate()` generator that yields items from every page. Support cursors through `next_cursor`, offsets through `offset` and `limit`, and Link-header pagination. Select the style from the specification or user input.

#### Pydantic Models (`models.py`)

Generate models from OpenAPI schemas or endpoint descriptions. Type every field and use `Optional` for nullable values. Set `populate_by_name = True` in `model_config` to support aliases.

#### Rate Limiting (`utils.py`)

Parse `X-RateLimit-Remaining` and `X-RateLimit-Reset`. When the remaining count reaches zero, log the limit and sleep until reset.

#### Retry Logic (`utils.py`)

Provide a decorator with exponential backoff and jitter. Expose the retry count through `max_retries`. Let callers control timing through `base_delay` and `max_delay`. Retry HTTP 429 by default, along with status 500 and the range from 502 through 504.

#### Caching (`utils.py`)

Store and send ETag values through `ETag` and `If-None-Match`. Handle modification timestamps through `Last-Modified` and `If-Modified-Since`. Return the cached response after a 304.

#### Async Support (`async_client.py`)

Mirror the synchronous `Client` API with `httpx.AsyncClient`. Convert its methods to `async def` and reuse the existing authentication code. Reuse the exception and model definitions as well.

### Step 5: Generate Resource Classes

Create one file under `resources/` for each API resource, such as users or orders.

```python
class UsersResource:
    def __init__(self, client: "Client") -> None:
        self._client = client

    def list(self, **params) -> List[User]:
        ...

    def get(self, user_id: str) -> User:
        ...

    def create(self, data: UserCreate) -> User:
        ...

    def update(self, user_id: str, data: UserUpdate) -> User:
        ...

    def delete(self, user_id: str) -> None:
        ...
```

Register each resource on `Client` as a lazy property.

### Step 6: Generate Tests

Create pytest coverage for every resource and utility module. Put `mock_client`, `mock_response`, and `sample_data` fixtures in `conftest.py`. Name resource tests after their resource, such as `test_users.py`.

Assert the mapped exception for each error status. Test pagination with mocked multi-page responses and verify that every item is collected. Mock `httpx` through `respx` or `pytest-httpx`.

### Step 7: Generate Project Files

Create `pyproject.toml` with `httpx` and `pydantic`. Add optional development dependencies such as `pytest` and `respx` when selected. Write `.env.example` with placeholders for credentials and the base URL. Write `README.md` with installation and configuration instructions, quick-start examples, and component documentation.

## Guidelines

### Code Standards

Use `snake_case` for functions and variables, and `PascalCase` for classes. Type every function argument and return value. Add Google-style docstrings to public methods. Keep each module focused on one concern. Follow `{SKILL_DIR}/references/client-patterns.md`.

### API Design Practices

Read `{SKILL_DIR}/references/api-design-practices.md` for REST conventions and error formats. It also covers pagination, authentication standards, and caching. Apply it when descriptions are ambiguous or a design choice remains open.

### Security

Never hardcode secrets. Store credentials in `.env`, load them with `python-dotenv`, and use environment variables at runtime. Default to HTTPS and warn when `base_url` uses HTTP. Validate and sanitize user-provided parameters before sending them.

### Constraints

Prefix every bundled resource path in `SKILL.md` with `{SKILL_DIR}`. Generated clients must support Python 3.10 or newer. Use `httpx` instead of `requests`. Generate Pydantic v2 models with `model_config` rather than an inner `Config` class. Keep generated code minimal and avoid unnecessary abstractions.
