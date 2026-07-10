#!/usr/bin/env python3
"""Scaffold a new Python API client project.

Usage:
    python scaffold_client.py <client_name> --output <dir> [component flags]

Example:
    python scaffold_client.py acme_api --output ./acme-client \
        --auth --errors --pagination --models --tests --docs \
        --rate-limit --retry --cache --async
"""

from __future__ import annotations

import argparse
import textwrap
from pathlib import Path


def write_file(path: Path, content: str) -> None:
    """Write content to a file, creating parent directories."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(textwrap.dedent(content).lstrip())
    print(f"  Created {path}")


def scaffold(
    name: str,
    output_dir: Path,
    *,
    auth: bool = True,
    errors: bool = True,
    pagination: bool = True,
    models: bool = True,
    tests: bool = True,
    docs: bool = True,
    rate_limit: bool = False,
    retry: bool = False,
    cache: bool = False,
    async_support: bool = False,
) -> None:
    """Create the directory structure for a new API client."""
    pkg = output_dir / name
    pkg.mkdir(parents=True, exist_ok=True)

    # __init__.py
    imports = [f'from .client import {_class_name(name)}']
    if async_support:
        imports.append(f'from .async_client import Async{_class_name(name)}')
    init_content = f'"""{_title(name)} API client."""\n\n' + "\n".join(imports) + "\n"
    write_file(pkg / "__init__.py", init_content)

    # client.py
    write_file(pkg / "client.py", _client_template(name, auth=auth, errors=errors))

    if auth:
        write_file(pkg / "auth.py", _placeholder("Authentication handlers"))

    if errors:
        write_file(pkg / "exceptions.py", _placeholder("Custom exception hierarchy"))

    if pagination:
        write_file(pkg / "pagination.py", _placeholder("Pagination helpers"))

    if models:
        write_file(pkg / "models.py", _placeholder("Pydantic request/response models"))

    if rate_limit or retry or cache:
        write_file(pkg / "utils.py", _placeholder("Utilities: rate limiting, retry, caching"))

    if async_support:
        write_file(pkg / "async_client.py", _placeholder("Async API client"))

    # Resources directory
    resources_dir = pkg / "resources"
    resources_dir.mkdir(exist_ok=True)
    write_file(resources_dir / "__init__.py", '"""API resource endpoint classes."""\n')

    # Tests
    if tests:
        tests_dir = output_dir / "tests"
        tests_dir.mkdir(exist_ok=True)
        write_file(tests_dir / "__init__.py", "")
        write_file(tests_dir / "conftest.py", _conftest_template(name))
        write_file(tests_dir / "test_client.py", _test_template(name))

    # Project files
    if docs:
        write_file(output_dir / "README.md", _readme_template(name))

    write_file(output_dir / ".env.example", _env_template(name))
    write_file(output_dir / "pyproject.toml", _pyproject_template(name, async_support=async_support))

    component_flags = {
        "auth": auth,
        "errors": errors,
        "pagination": pagination,
        "models": models,
        "rate-limit": rate_limit,
        "retry": retry,
        "cache": cache,
        "async": async_support,
        "tests": tests,
        "docs": docs,
    }
    enabled = [name for name, active in component_flags.items() if active]

    print(f"\nScaffolded {name} at {output_dir}")
    print(f"Components: {', '.join(enabled)}")


def _class_name(name: str) -> str:
    """Convert snake_case name to PascalCase class name."""
    return "".join(word.capitalize() for word in name.split("_")) + "Client"


def _title(name: str) -> str:
    """Convert snake_case to title case."""
    return " ".join(word.capitalize() for word in name.split("_"))


def _placeholder(description: str) -> str:
    return f'"""{description}.\n\nGenerate implementation based on client-patterns.md reference.\n"""\n'


def _client_template(name: str, *, auth: bool, errors: bool) -> str:
    cls = _class_name(name)
    auth_import = "\nfrom .auth import AuthHandler" if auth else ""
    auth_param = "\n        auth: AuthHandler | None = None," if auth else ""
    auth_assign = "\n        self.auth = auth" if auth else ""
    return f'''"""{_title(name)} API client."""

from __future__ import annotations

from typing import Any, Optional

import httpx
{auth_import}


class {cls}:
    """Synchronous client for the {_title(name)} API."""

    def __init__(
        self,
        base_url: str,{auth_param}
        timeout: float = 30.0,
    ) -> None:
        self.base_url = base_url.rstrip("/"){auth_assign}
        self._client = httpx.Client(base_url=self.base_url, timeout=timeout)

    def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json: Any | None = None,
        **kwargs: Any,
    ) -> httpx.Response:
        """Send an HTTP request."""
        request = self._client.build_request(
            method, path, params=params, json=json, **kwargs
        )
        response = self._client.send(request)
        if not response.is_success:
            raise Exception(f"HTTP {{response.status_code}}: {{response.text}}")
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
        self._client.close()

    def __enter__(self) -> {cls}:
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()
'''


def _conftest_template(name: str) -> str:
    cls = _class_name(name)
    return f'''"""Pytest fixtures for {_title(name)} client tests."""

import pytest
import httpx

from {name} import {cls}


@pytest.fixture
def client():
    """Create a test client."""
    return {cls}(base_url="https://api.example.com")


@pytest.fixture
def mock_response():
    """Factory for mock httpx responses."""
    def _make(status_code: int = 200, json_data: dict = None, headers: dict = None):
        return httpx.Response(
            status_code=status_code,
            json=json_data or {{}},
            headers=headers or {{}},
            request=httpx.Request("GET", "https://api.example.com/test"),
        )
    return _make
'''


def _test_template(name: str) -> str:
    return f'''"""Basic tests for {_title(name)} client."""


class TestClient:
    def test_client_init(self, client):
        assert client.base_url == "https://api.example.com"

    def test_client_context_manager(self):
        from {name} import {_class_name(name)}
        with {_class_name(name)}(base_url="https://api.example.com") as c:
            assert c.base_url == "https://api.example.com"
'''


def _readme_template(name: str) -> str:
    title = _title(name)
    cls = _class_name(name)
    return f'''# {title} Client

Python client for the {title} API.

## Installation

```bash
pip install -e .
```

## Quick Start

```python
from {name} import {cls}

client = {cls}(base_url="https://api.example.com")
```

## Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

## Development

```bash
pip install -e ".[dev]"
pytest
```
'''


def _env_template(name: str) -> str:
    upper = name.upper()
    return f'''{upper}_BASE_URL=https://api.example.com
{upper}_API_KEY=your-api-key-here
'''


def _pyproject_template(name: str, *, async_support: bool = False) -> str:
    async_deps = '\n    "pytest-asyncio>=0.23",' if async_support else ""
    return f'''[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "{name.replace("_", "-")}"
version = "0.1.0"
description = "Python client for the {_title(name)} API"
requires-python = ">=3.10"
dependencies = [
    "httpx>=0.27",
    "pydantic>=2.0",
    "python-dotenv>=1.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-httpx>=0.30",{async_deps}
]
'''


def main() -> None:
    parser = argparse.ArgumentParser(description="Scaffold a Python API client project")
    parser.add_argument("name", help="Client package name (snake_case)")
    parser.add_argument("--output", "-o", required=True, help="Output directory")
    parser.add_argument("--auth", action="store_true", default=False)
    parser.add_argument("--errors", action="store_true", default=False)
    parser.add_argument("--pagination", action="store_true", default=False)
    parser.add_argument("--models", action="store_true", default=False)
    parser.add_argument("--tests", action="store_true", default=False)
    parser.add_argument("--docs", action="store_true", default=False)
    parser.add_argument("--rate-limit", action="store_true", default=False)
    parser.add_argument("--retry", action="store_true", default=False)
    parser.add_argument("--cache", action="store_true", default=False)
    parser.add_argument("--async", dest="async_support", action="store_true", default=False)

    args = parser.parse_args()
    output = Path(args.output)

    scaffold(
        name=args.name,
        output_dir=output,
        auth=args.auth,
        errors=args.errors,
        pagination=args.pagination,
        models=args.models,
        tests=args.tests,
        docs=args.docs,
        rate_limit=args.rate_limit,
        retry=args.retry,
        cache=args.cache,
        async_support=args.async_support,
    )


if __name__ == "__main__":
    main()
