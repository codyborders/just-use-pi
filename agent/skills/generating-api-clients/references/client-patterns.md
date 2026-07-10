# Python API Client Code Patterns

Reference templates for each configurable component. Adapt these patterns to the specific API being wrapped.

## Base Client

```python
"""API client core."""

from __future__ import annotations

import httpx
from typing import Any, Optional

from .auth import AuthHandler
from .exceptions import map_status_to_exception


class Client:
    """Synchronous API client."""

    def __init__(
        self,
        base_url: str,
        auth: Optional[AuthHandler] = None,
        timeout: float = 30.0,
        headers: Optional[dict[str, str]] = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.auth = auth
        self._client = httpx.Client(
            base_url=self.base_url,
            timeout=timeout,
            headers=headers or {},
        )
        # Resource accessors are registered here by subclasses or __init__

    def _request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[dict[str, Any]] = None,
        json: Optional[Any] = None,
        **kwargs: Any,
    ) -> httpx.Response:
        """Send an HTTP request with auth and error handling."""
        request = self._client.build_request(
            method, path, params=params, json=json, **kwargs
        )
        if self.auth:
            request = self.auth.apply(request)

        response = self._client.send(request)

        if not response.is_success:
            raise map_status_to_exception(response)

        return response

    def _get(self, path: str, **kwargs: Any) -> httpx.Response:
        return self._request("GET", path, **kwargs)

    def _post(self, path: str, **kwargs: Any) -> httpx.Response:
        return self._request("POST", path, **kwargs)

    def _put(self, path: str, **kwargs: Any) -> httpx.Response:
        return self._request("PUT", path, **kwargs)

    def _patch(self, path: str, **kwargs: Any) -> httpx.Response:
        return self._request("PATCH", path, **kwargs)

    def _delete(self, path: str, **kwargs: Any) -> httpx.Response:
        return self._request("DELETE", path, **kwargs)

    def close(self) -> None:
        """Close the underlying HTTP session."""
        self._client.close()

    def __enter__(self) -> Client:
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()
```

## Authentication Handlers

```python
"""Authentication handlers."""

from __future__ import annotations

import httpx
from abc import ABC, abstractmethod
from typing import Optional


class AuthHandler(ABC):
    """Base authentication handler."""

    @abstractmethod
    def apply(self, request: httpx.Request) -> httpx.Request:
        """Apply authentication to the request."""
        ...


class APIKeyAuth(AuthHandler):
    """API key authentication via header or query parameter."""

    def __init__(
        self, api_key: str, header_name: str = "X-API-Key", as_query: bool = False,
        query_param_name: str = "api_key",
    ) -> None:
        self.api_key = api_key
        self.header_name = header_name
        self.as_query = as_query
        self.query_param_name = query_param_name

    def apply(self, request: httpx.Request) -> httpx.Request:
        if self.as_query:
            request.url = request.url.copy_merge_params(
                {self.query_param_name: self.api_key}
            )
        else:
            request.headers[self.header_name] = self.api_key
        return request


class BearerAuth(AuthHandler):
    """Bearer token authentication."""

    def __init__(self, token: str) -> None:
        self.token = token

    def apply(self, request: httpx.Request) -> httpx.Request:
        request.headers["Authorization"] = f"Bearer {self.token}"
        return request


class OAuth2Auth(AuthHandler):
    """OAuth2 client credentials authentication with auto-refresh."""

    def __init__(
        self,
        client_id: str,
        client_secret: str,
        token_url: str,
        scope: Optional[str] = None,
    ) -> None:
        self.client_id = client_id
        self.client_secret = client_secret
        self.token_url = token_url
        self.scope = scope
        self._token: Optional[str] = None

    def _fetch_token(self) -> str:
        response = httpx.post(
            self.token_url,
            data={
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                **({"scope": self.scope} if self.scope else {}),
            },
        )
        response.raise_for_status()
        self._token = response.json()["access_token"]
        return self._token

    def apply(self, request: httpx.Request) -> httpx.Request:
        if not self._token:
            self._fetch_token()
        request.headers["Authorization"] = f"Bearer {self._token}"
        return request
```

## Exception Hierarchy

```python
"""Custom exception hierarchy for API errors."""

from __future__ import annotations

from typing import Any, Optional
import httpx


class APIError(Exception):
    """Base exception for all API errors."""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        response: Optional[httpx.Response] = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.response = response
        super().__init__(message)


class AuthenticationError(APIError):
    """Raised on 401 Unauthorized."""
    pass


class ForbiddenError(APIError):
    """Raised on 403 Forbidden."""
    pass


class NotFoundError(APIError):
    """Raised on 404 Not Found."""
    pass


class ValidationError(APIError):
    """Raised on 422 Unprocessable Entity."""

    def __init__(
        self,
        message: str,
        details: Optional[list[dict[str, Any]]] = None,
        **kwargs: Any,
    ) -> None:
        super().__init__(message, **kwargs)
        self.details = details or []


class RateLimitError(APIError):
    """Raised on 429 Too Many Requests."""

    def __init__(
        self,
        message: str,
        retry_after: Optional[float] = None,
        **kwargs: Any,
    ) -> None:
        super().__init__(message, **kwargs)
        self.retry_after = retry_after


class ServerError(APIError):
    """Raised on 5xx server errors."""
    pass


_STATUS_MAP: dict[int, type[APIError]] = {
    401: AuthenticationError,
    403: ForbiddenError,
    404: NotFoundError,
    422: ValidationError,
    429: RateLimitError,
}


def map_status_to_exception(response: httpx.Response) -> APIError:
    """Map an HTTP response to the appropriate exception."""
    status = response.status_code
    try:
        body = response.json()
        message = body.get("error", {}).get("message", response.text)
    except Exception:
        message = response.text

    exc_class = _STATUS_MAP.get(status)
    if exc_class is None:
        exc_class = ServerError if 500 <= status < 600 else APIError

    kwargs: dict[str, Any] = {"status_code": status, "response": response}

    if exc_class is RateLimitError:
        retry_after = response.headers.get("Retry-After")
        if retry_after:
            kwargs["retry_after"] = float(retry_after)
        return RateLimitError(message, **kwargs)

    if exc_class is ValidationError:
        details = []
        try:
            details = response.json().get("error", {}).get("details", [])
        except Exception:
            pass
        return ValidationError(message, details=details, **kwargs)

    return exc_class(message, **kwargs)
```

## Pagination Helpers

```python
"""Pagination helpers for auto-paginating API responses."""

from __future__ import annotations

import re
from typing import Any, Callable, Generator, Optional


def auto_paginate_cursor(
    fetch_page: Callable[..., dict[str, Any]],
    data_key: str = "data",
    cursor_key: str = "next_cursor",
    has_more_key: str = "has_more",
    cursor_param: str = "cursor",
    limit: int = 100,
    **extra_params: Any,
) -> Generator[Any, None, None]:
    """Auto-paginate a cursor-based API endpoint.

    Args:
        fetch_page: Callable that accepts keyword args and returns a response dict.
        data_key: Key in response containing the items list.
        cursor_key: Key in response (or nested under "pagination") holding the next cursor.
        has_more_key: Key indicating whether more pages exist.
        cursor_param: Query parameter name for cursor.
        limit: Page size.
        extra_params: Additional parameters passed to fetch_page.

    Yields:
        Individual items across all pages.
    """
    cursor: Optional[str] = None
    while True:
        params = {cursor_param: cursor, "limit": limit, **extra_params}
        params = {k: v for k, v in params.items() if v is not None}

        result = fetch_page(**params)
        items = result.get(data_key, [])
        yield from items

        pagination = result.get("pagination", result)
        cursor = pagination.get(cursor_key)
        has_more = pagination.get(has_more_key, cursor is not None)
        if not has_more or not cursor:
            break


def auto_paginate_offset(
    fetch_page: Callable[..., dict[str, Any]],
    data_key: str = "data",
    total_key: str = "total",
    limit: int = 100,
    **extra_params: Any,
) -> Generator[Any, None, None]:
    """Auto-paginate an offset-based API endpoint.

    Yields:
        Individual items across all pages.
    """
    offset = 0
    while True:
        params = {"offset": offset, "limit": limit, **extra_params}
        result = fetch_page(**params)
        items = result.get(data_key, [])
        yield from items

        if len(items) < limit:
            break
        total = result.get("pagination", result).get(total_key)
        offset += limit
        if total is not None and offset >= total:
            break


def auto_paginate_link_header(
    fetch_page: Callable[..., Any],
    initial_url: str,
) -> Generator[Any, None, None]:
    """Auto-paginate using RFC 8288 Link headers.

    Args:
        fetch_page: Callable that accepts a url keyword and returns
                    an object with .json() and .headers attributes (httpx.Response).
        initial_url: The first page URL.

    Yields:
        Individual items from the response data.
    """
    url: Optional[str] = initial_url
    while url:
        response = fetch_page(url=url)
        data = response.json()
        items = data if isinstance(data, list) else data.get("data", [])
        yield from items

        link_header = response.headers.get("Link", "")
        url = _parse_next_link(link_header)


def _parse_next_link(link_header: str) -> Optional[str]:
    """Extract the 'next' URL from a Link header."""
    for part in link_header.split(","):
        match = re.match(r'<([^>]+)>;\s*rel="next"', part.strip())
        if match:
            return match.group(1)
    return None
```

## Rate Limiter

```python
"""Rate limiting utilities."""

from __future__ import annotations

import logging
import time
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


class RateLimiter:
    """Track and respect API rate limits from response headers."""

    def __init__(self) -> None:
        self.remaining: Optional[int] = None
        self.reset_at: Optional[float] = None

    def update(self, response: httpx.Response) -> None:
        """Update state from response headers."""
        remaining = response.headers.get("X-RateLimit-Remaining")
        reset = response.headers.get("X-RateLimit-Reset")

        if remaining is not None:
            self.remaining = int(remaining)
        if reset is not None:
            self.reset_at = float(reset)

    def wait_if_needed(self) -> None:
        """Sleep until the rate limit window resets if remaining is zero."""
        if self.remaining is not None and self.remaining <= 0 and self.reset_at:
            wait_time = self.reset_at - time.time()
            if wait_time > 0:
                logger.info("Rate limited. Sleeping %.1f seconds.", wait_time)
                time.sleep(wait_time)
```

## Retry Decorator

```python
"""Retry logic with exponential backoff and jitter."""

from __future__ import annotations

import logging
import random
import time
from functools import wraps
from typing import Any, Callable, Optional, TypeVar

import httpx

logger = logging.getLogger(__name__)

F = TypeVar("F", bound=Callable[..., Any])

RETRYABLE_STATUS_CODES: set[int] = {429, 500, 502, 503, 504}


def retry(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    retryable_statuses: Optional[set[int]] = None,
) -> Callable[[F], F]:
    """Decorator for retrying failed HTTP requests with exponential backoff.

    Args:
        max_retries: Maximum number of retry attempts.
        base_delay: Initial delay in seconds.
        max_delay: Maximum delay in seconds.
        retryable_statuses: HTTP status codes that trigger a retry.
    """
    statuses = retryable_statuses or RETRYABLE_STATUS_CODES

    def decorator(func: F) -> F:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            last_exception: Optional[Exception] = None
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except httpx.HTTPStatusError as exc:
                    if exc.response.status_code not in statuses:
                        raise
                    last_exception = exc
                except httpx.TransportError as exc:
                    last_exception = exc

                if attempt < max_retries:
                    delay = min(base_delay * (2 ** attempt), max_delay)
                    jitter = random.uniform(0, delay * 0.5)
                    sleep_time = delay + jitter
                    logger.warning(
                        "Retry %d/%d after %.1fs: %s",
                        attempt + 1, max_retries, sleep_time, last_exception,
                    )
                    time.sleep(sleep_time)

            raise last_exception  # type: ignore[misc]

        return wrapper  # type: ignore[return-value]

    return decorator
```

## Cache Layer

```python
"""ETag and Last-Modified caching."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

import httpx


@dataclass
class CachedResponse:
    """A cached HTTP response."""
    body: Any
    etag: Optional[str] = None
    last_modified: Optional[str] = None


class ResponseCache:
    """In-memory cache using ETag and Last-Modified headers."""

    def __init__(self) -> None:
        self._store: dict[str, CachedResponse] = {}

    def get_headers(self, cache_key: str) -> dict[str, str]:
        """Return conditional headers for a cached key."""
        headers: dict[str, str] = {}
        cached = self._store.get(cache_key)
        if cached:
            if cached.etag:
                headers["If-None-Match"] = cached.etag
            if cached.last_modified:
                headers["If-Modified-Since"] = cached.last_modified
        return headers

    def update(self, cache_key: str, response: httpx.Response) -> Any:
        """Update cache from response. Return the response body."""
        if response.status_code == 304:
            cached = self._store.get(cache_key)
            if cached:
                return cached.body
            return None

        body = response.json()
        self._store[cache_key] = CachedResponse(
            body=body,
            etag=response.headers.get("ETag"),
            last_modified=response.headers.get("Last-Modified"),
        )
        return body

    def make_key(self, method: str, url: str, params: Optional[dict] = None) -> str:
        """Generate a cache key from request details."""
        param_str = "&".join(f"{k}={v}" for k, v in sorted((params or {}).items()))
        return f"{method}:{url}?{param_str}"
```

## Async Client Variant

```python
"""Async API client."""

from __future__ import annotations

import httpx
from typing import Any, Optional

from .auth import AuthHandler
from .exceptions import map_status_to_exception


class AsyncClient:
    """Asynchronous API client."""

    def __init__(
        self,
        base_url: str,
        auth: Optional[AuthHandler] = None,
        timeout: float = 30.0,
        headers: Optional[dict[str, str]] = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.auth = auth
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=timeout,
            headers=headers or {},
        )

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[dict[str, Any]] = None,
        json: Optional[Any] = None,
        **kwargs: Any,
    ) -> httpx.Response:
        request = self._client.build_request(
            method, path, params=params, json=json, **kwargs
        )
        if self.auth:
            request = self.auth.apply(request)

        response = await self._client.send(request)

        if not response.is_success:
            raise map_status_to_exception(response)

        return response

    async def _get(self, path: str, **kwargs: Any) -> httpx.Response:
        return await self._request("GET", path, **kwargs)

    async def _post(self, path: str, **kwargs: Any) -> httpx.Response:
        return await self._request("POST", path, **kwargs)

    async def _put(self, path: str, **kwargs: Any) -> httpx.Response:
        return await self._request("PUT", path, **kwargs)

    async def _patch(self, path: str, **kwargs: Any) -> httpx.Response:
        return await self._request("PATCH", path, **kwargs)

    async def _delete(self, path: str, **kwargs: Any) -> httpx.Response:
        return await self._request("DELETE", path, **kwargs)

    async def close(self) -> None:
        await self._client.aclose()

    async def __aenter__(self) -> AsyncClient:
        return self

    async def __aexit__(self, *args: Any) -> None:
        await self.close()
```

## Pydantic Model Patterns

```python
"""Pydantic model generation patterns."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# Base model with common config
class APIModel(BaseModel):
    """Base model for all API response objects."""
    model_config = {"populate_by_name": True, "extra": "ignore"}


# Example resource model
class User(APIModel):
    id: str
    name: str
    email: str
    created_at: datetime = Field(alias="createdAt")
    updated_at: Optional[datetime] = Field(None, alias="updatedAt")


# Create/update request models
class UserCreate(BaseModel):
    name: str
    email: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None


# Paginated response wrapper
class PaginationInfo(APIModel):
    next_cursor: Optional[str] = Field(None, alias="nextCursor")
    has_more: bool = Field(False, alias="hasMore")
    total: Optional[int] = None


class PaginatedResponse(APIModel):
    """Generic paginated response."""
    data: list
    pagination: PaginationInfo
```

## Resource Class Pattern

```python
"""Resource class pattern for endpoint groups."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, Optional

if TYPE_CHECKING:
    from .client import Client

from .models import User, UserCreate, UserUpdate
from .pagination import auto_paginate_cursor


class UsersResource:
    """Operations on /users endpoints."""

    def __init__(self, client: Client) -> None:
        self._client = client

    def list(
        self, *, limit: int = 100, cursor: Optional[str] = None, **params: Any
    ) -> list[User]:
        """List users (single page)."""
        response = self._client._get(
            "/users", params={"limit": limit, "cursor": cursor, **params}
        )
        data = response.json().get("data", [])
        return [User.model_validate(item) for item in data]

    def list_all(self, **params: Any) -> list[User]:
        """List all users across all pages."""
        def fetch_page(**kw: Any) -> dict:
            resp = self._client._get("/users", params=kw)
            return resp.json()

        items = list(auto_paginate_cursor(fetch_page, **params))
        return [User.model_validate(item) for item in items]

    def get(self, user_id: str) -> User:
        """Get a single user by ID."""
        response = self._client._get(f"/users/{user_id}")
        return User.model_validate(response.json())

    def create(self, data: UserCreate) -> User:
        """Create a new user."""
        response = self._client._post("/users", json=data.model_dump())
        return User.model_validate(response.json())

    def update(self, user_id: str, data: UserUpdate) -> User:
        """Update an existing user."""
        response = self._client._patch(
            f"/users/{user_id}", json=data.model_dump(exclude_unset=True)
        )
        return User.model_validate(response.json())

    def delete(self, user_id: str) -> None:
        """Delete a user."""
        self._client._delete(f"/users/{user_id}")
```

## Test Patterns

```python
"""Test fixtures and patterns."""

# -- conftest.py --

import pytest
import httpx
from unittest.mock import MagicMock

from my_client import Client
from my_client.auth import BearerAuth


@pytest.fixture
def mock_transport():
    """Create a mock httpx transport for testing."""
    return MagicMock(spec=httpx.BaseTransport)


@pytest.fixture
def client(mock_transport):
    """Create a test client with mocked transport."""
    return Client(
        base_url="https://api.example.com",
        auth=BearerAuth(token="test-token"),
    )


@pytest.fixture
def mock_response():
    """Factory for mock httpx responses."""
    def _make(status_code: int = 200, json_data: dict = None, headers: dict = None):
        response = httpx.Response(
            status_code=status_code,
            json=json_data or {},
            headers=headers or {},
            request=httpx.Request("GET", "https://api.example.com/test"),
        )
        return response
    return _make


# -- test_client.py --

import pytest
from my_client.exceptions import NotFoundError, AuthenticationError, RateLimitError


class TestErrorHandling:
    def test_not_found_raises(self, client, mock_response, monkeypatch):
        resp = mock_response(404, {"error": {"message": "Not found"}})
        monkeypatch.setattr(client._client, "send", lambda req: resp)
        with pytest.raises(NotFoundError) as exc_info:
            client._get("/missing")
        assert exc_info.value.status_code == 404

    def test_auth_error_raises(self, client, mock_response, monkeypatch):
        resp = mock_response(401, {"error": {"message": "Invalid token"}})
        monkeypatch.setattr(client._client, "send", lambda req: resp)
        with pytest.raises(AuthenticationError):
            client._get("/protected")

    def test_rate_limit_includes_retry_after(self, client, mock_response, monkeypatch):
        resp = mock_response(
            429,
            {"error": {"message": "Too many requests"}},
            {"Retry-After": "30"},
        )
        monkeypatch.setattr(client._client, "send", lambda req: resp)
        with pytest.raises(RateLimitError) as exc_info:
            client._get("/limited")
        assert exc_info.value.retry_after == 30.0


class TestPagination:
    def test_auto_paginate_collects_all_items(self):
        pages = [
            {"data": [{"id": "1"}, {"id": "2"}], "pagination": {"next_cursor": "abc", "has_more": True}},
            {"data": [{"id": "3"}], "pagination": {"next_cursor": None, "has_more": False}},
        ]
        call_count = 0

        def fetch_page(**params):
            nonlocal call_count
            result = pages[call_count]
            call_count += 1
            return result

        from my_client.pagination import auto_paginate_cursor
        items = list(auto_paginate_cursor(fetch_page, limit=2))
        assert len(items) == 3
        assert call_count == 2
```

## pyproject.toml Template

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "my-api-client"
version = "0.1.0"
description = "Python client for the My API"
requires-python = ">=3.10"
dependencies = [
    "httpx>=0.27",
    "pydantic>=2.0",
    "python-dotenv>=1.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-httpx>=0.30",
    "pytest-asyncio>=0.23",
]
```
