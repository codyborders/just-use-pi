# Python Practices

Repo conventions win. Use this file when a project lacks stronger local guidance or when a choice is still open.

## Core Python Rules

### Error Handling and Exceptions

Prefer a narrow exception type over `Exception`. Keep each `try` block small so the handler covers the operation you meant to guard. Catch `Exception` only when you re-raise, translate at a boundary, or isolate a worker that must not bring down its parent.

Use `ValueError`, `TypeError`, or a domain exception for user input and external data. Use `assert` only for programmer invariants; optimized Python can remove assertions, so application logic must not depend on them.

Use context managers for any resource that must be released, including file handles, socket handles, database sessions, and locks. Define a small exception hierarchy for domain failures that callers can handle without parsing strings.

```python
from collections.abc import Iterator
from contextlib import contextmanager

class DataProcessingError(Exception):
    """Base error for data processing failures."""

class ValidationError(DataProcessingError):
    """Raised when input data fails validation."""

@contextmanager
def process_file(path: str) -> Iterator[str]:
    """Read a text file and translate file errors."""
    try:
        with open(path, "r", encoding="utf-8") as file:
            yield file.read()
    except FileNotFoundError as error:
        raise DataProcessingError(f"File not found: {path}") from error
    except OSError as error:
        raise DataProcessingError(f"Failed to read file: {path}") from error
```

### Type Hints and Static Typing

Annotate public function signatures. On Python 3.10 and newer, prefer built-in collection and union syntax such as `list[str]`, `dict[str, int]`, and `str | None`. Keep `typing` imports for `TypeVar`, `Protocol`, `ParamSpec`, `Callable`, and compatibility with older runtimes.

Run the type checker configured by the repo, usually `mypy`. Use runtime validation at system boundaries when data comes from users, files, network calls, queues, or environment variables.

```python
from dataclasses import dataclass
from typing import Generic, TypeVar

T = TypeVar("T")

@dataclass(frozen=True)
class Result(Generic[T]):
    """Value-or-error result for boundary code."""
    value: T | None = None
    error: str | None = None

    @property
    def is_success(self) -> bool:
        return self.error is None

def process_data(
    data: list[dict[str, str | int]],
    filter_key: str,
) -> Result[list[str]]:
    """Extract string values for one key."""
    if not filter_key:
        return Result(error="filter_key is required")

    filtered = [
        str(item[filter_key])
        for item in data
        if filter_key in item
    ]
    return Result(value=filtered)
```

### Concurrency

Use `async` and `await` for I/O-bound concurrency. Use threads for blocking I/O or libraries with thread-based APIs. Do not rely on accidental atomic behavior in built-in types; use `queue.Queue`, locks, or `threading.Condition` when threads share state. Use `multiprocessing` or `concurrent.futures.ProcessPoolExecutor` for CPU-heavy work.

```python
import asyncio

import aiohttp

async def fetch_data(
    session: aiohttp.ClientSession,
    url: str,
) -> dict[str, object]:
    """Fetch JSON from one URL."""
    async with session.get(url) as response:
        response.raise_for_status()
        return await response.json()

async def fetch_multiple(urls: list[str]) -> list[dict[str, object]]:
    """Fetch JSON from several URLs concurrently."""
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_data(session, url) for url in urls]
        return await asyncio.gather(*tasks)
```

### Configuration and Dependencies

Read secrets and environment-specific values from `.env` or the process environment. Use `python-dotenv` for local apps that need `.env` loading, and use Pydantic settings when typed configuration pays for itself.

Pass dependencies explicitly. Add a dependency injection library only when the codebase already uses one or when constructor wiring has become the problem being solved. Model feature flags as configuration values, not scattered module globals.

```python
from functools import lru_cache

from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    app_name: str = "MyApp"
    debug: bool = Field(False, env="DEBUG")
    database_url: str = Field(..., env="DATABASE_URL")
    api_key: str = Field(..., env="API_KEY")

    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    """Return the cached settings object."""
    return Settings()
```

## File and Directory Structure

Use this layout for new packages unless the repo already has a different pattern.

```text
python-project/
├── src/                    # Source code
│   └── package_name/       # Main package
│       ├── __init__.py
│       ├── __main__.py     # Entry point for -m execution
│       ├── main.py         # Main application logic
│       ├── models/         # Data models
│       │   ├── __init__.py
│       │   └── user.py
│       ├── services/       # Business logic
│       │   ├── __init__.py
│       │   └── auth.py
│       ├── utils/          # Utility functions
│       │   ├── __init__.py
│       │   └── helpers.py
│       └── api/            # API endpoints, when needed
│           ├── __init__.py
│           └── routes.py
├── tests/                  # Test files
│   ├── __init__.py
│   ├── conftest.py         # pytest fixtures
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── test_*.py           # Test modules
├── docs/                   # Documentation
│   ├── conf.py             # Sphinx configuration
│   └── index.rst           # Documentation index
├── scripts/                # Utility scripts
├── data/                   # Data files, when needed
├── notebooks/              # Jupyter notebooks, when needed
├── requirements/           # Dependency files
│   ├── base.txt            # Base requirements
│   ├── dev.txt             # Development requirements
│   └── prod.txt            # Production requirements
├── .env.example            # Example environment variables
├── .gitignore
├── .pre-commit-config.yaml
├── pyproject.toml          # Project configuration
├── setup.py                # Package setup, if distributing
├── setup.cfg               # Setup configuration
├── MANIFEST.in             # Package manifest
├── Dockerfile              # Container configuration, if used by the repo
└── README.md               # Project documentation
```

Use `snake_case.py` for modules, `test_*.py` for tests, `UPPER_CASE` for module-level constants, and `_internal.py` for private modules.

Prefer package-qualified imports for application modules. Keep network calls, database connections, flag parsing, and process startup out of import paths. Put executable logic behind `main()` and `if __name__ == "__main__":`. Use `if TYPE_CHECKING:` only for runtime cycles or imports that are too heavy at runtime.

## Code Style

### Documentation

Use Google-style or NumPy-style docstrings consistently. Add module docstrings to public modules, annotate function signatures, and include examples when they prevent misuse. Start each test file with a short description of the behavior under test and how the test checks it. Write comments as complete sentences that explain why the code exists.

```python
"""User authentication and authorization helpers.

This module handles login, logout, and permission checks.
"""

from typing import Any

def authenticate_user(username: str, password: str) -> dict[str, Any] | None:
    """Authenticate a user with username and password.

    Args:
        username: The user's username.
        password: The user's password. The caller must pass plain text.

    Returns:
        User data when authentication succeeds, otherwise None.

    Raises:
        ValueError: If username or password is empty.
        DatabaseError: If the database query fails.

    Example:
        >>> user = authenticate_user("alice", "secret123")
        >>> if user:
        ...     print(f"Welcome, {user['name']}!")
    """
    if not username or not password:
        raise ValueError("Username and password are required")

    # Query the user store here.
    return None
```

### Logging

Prefer structured logging through `structlog` or the standard `logging` module with a JSON formatter. Choose the level that matches the event. Attach context through `extra` or structured fields. Pass variable data as logging arguments instead of pre-formatting strings; this keeps disabled log statements cheap.

```python
import logging
from collections.abc import Callable
from functools import wraps
from typing import ParamSpec, TypeVar

Parameters = ParamSpec("Parameters")
ReturnValue = TypeVar("ReturnValue")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

def log_execution(
    func: Callable[Parameters, ReturnValue],
) -> Callable[Parameters, ReturnValue]:
    """Log a function call and re-raise failures."""
    @wraps(func)
    def wrapper(
        *args: Parameters.args,
        **kwargs: Parameters.kwargs,
    ) -> ReturnValue:
        logger.info(
            "Executing %s",
            func.__name__,
            extra={
                "function": func.__name__,
                "module": func.__module__,
            },
        )
        try:
            result = func(*args, **kwargs)
            logger.info("Successfully executed %s", func.__name__)
            return result
        except Exception:
            logger.exception(
                "Error in %s",
                func.__name__,
                extra={"function": func.__name__},
            )
            raise
    return wrapper
```

### Properties and Accessors

Expose simple stored values as public attributes. Use `@property` when access is cheap, deterministic, and unsurprising. Use property setters to validate or normalize assignment. Avoid `get_*` and `set_*` methods for plain attributes.

### Testing

Use pytest unless the repo uses another runner. Keep coverage above the project threshold; use 80% as the default floor when no threshold exists. Put shared setup in fixtures. Use `unittest.mock` or `pytest-mock` for seams around external systems. Use Hypothesis when example-based tests miss important input ranges.

```python
# tests/test_user_service.py
"""User service tests using fixtures and property-based validation."""

from unittest.mock import patch

import pytest
from hypothesis import given, strategies as st

from src.package_name.models.user import User
from src.package_name.services.user import UserService

@pytest.fixture
def user_service():
    """Create a UserService instance for each test."""
    return UserService()

@pytest.fixture
def mock_database():
    """Patch the database connection used by UserService."""
    with patch("src.package_name.services.user.get_db_connection") as mock:
        yield mock

def test_create_user(user_service, mock_database):
    """Create a user and persist it once."""
    mock_database.return_value.save.return_value = True
    user_data = {"name": "Alice", "email": "alice@example.com"}

    user = user_service.create_user(**user_data)

    assert user.name == "Alice"
    assert user.email == "alice@example.com"
    mock_database.return_value.save.assert_called_once()

@given(
    name=st.text(min_size=1, max_size=50),
    email=st.emails(),
)
def test_user_validation(name, email):
    """Accept generated valid names and emails."""
    user = User(name=name, email=email)
    assert user.is_valid()
```

## Pattern Guidance

Prefer context managers, type hints, focused docstrings, virtual environments, lazy logging, tests near changed code, simple comprehensions, cheap imports, and specific exception handlers.

Avoid mutable default arguments, `import *`, unjustified `except Exception`, `assert` for external data, module globals that mutate, dense comprehensions, nested ternaries, mutating a list while iterating over it, import-time I/O, metaclasses or monkeypatching without a design need, `eval()` or `exec()` with user input, and hardcoded secrets.

## Development Workflow

Start with interfaces and data structures. Add tests before or alongside the change. Implement in small pieces that can be checked independently. Update docstrings or docs when behavior changes. Refactor while tests stay green. Self-review before handing off.

Before review, verify style, types, tests, documentation, exception handling, import behavior, logging, simple properties, security, and performance. Broad exception catches need a named reason: re-raise, boundary translation, or worker isolation.

## Performance

Profile before optimizing. Use `cProfile` or `line_profiler` to find the hot path. Cache expensive pure work with `functools.lru_cache`. Use generators for large streams. Use NumPy or Pandas for numerical and tabular workloads. Use async I/O for concurrent network or file operations.

```python
import time
from collections.abc import Iterator
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_calculation(n: int) -> int:
    """Return a cached calculation result."""
    time.sleep(0.1)  # Simulate slow work.
    return n ** 2

def process_large_dataset(data: list[int]) -> Iterator[int]:
    """Yield processed even numbers without materializing all results."""
    for item in data:
        if item % 2 == 0:
            yield expensive_calculation(item)

results = list(process_large_dataset(range(1000)))
```

## Security and Privacy

Validate data at trust boundaries. Use parameterized queries for SQL. Store secrets in environment variables or `.env`, never in source. Audit and update dependencies. Use established authentication and password libraries such as `passlib` when the project permits them.

```python
import hashlib
import hmac
import secrets

def generate_secure_token() -> str:
    """Generate a cryptographically secure token."""
    return secrets.token_urlsafe(32)

def hash_password(password: str) -> tuple[str, str]:
    """Hash a password with a random salt."""
    salt = secrets.token_hex(32)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    )
    return salt, password_hash.hex()

def verify_password(password: str, salt: str, password_hash: str) -> bool:
    """Compare a password with a stored hash."""
    new_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    )
    return hmac.compare_digest(new_hash.hex(), password_hash)
```

## Tooling and Development Environment

Use the repo's formatter, linter, type checker, and test command. When a new repo has no toolchain yet, start with Black, isort, flake8, mypy, pytest, coverage, and pre-commit.

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install development dependencies
pip install -r requirements-dev.txt

# Install pre-commit hooks
pre-commit install

# Run checks
black src tests
isort src tests
flake8 src tests
mypy src
pytest --cov=src
```

Configure editors through checked-in files such as `.editorconfig`, `pyproject.toml`, and `setup.cfg`. VS Code with Pylance and PyCharm both work well when they read the same project settings as CI.

## Dependency Choices

Use `requests` or `httpx` for HTTP, Pydantic for data validation, Click or Typer for CLIs, FastAPI or Flask for web apps, SQLAlchemy for database access, and Celery for task queues when those tools fit the repo.

Use pytest, pytest-cov, pytest-mock, Hypothesis, factory-boy, and responses for tests when the project needs those capabilities. Use Black, isort, flake8, mypy, pre-commit, and tox for local checks and test automation.

## Example Prompts for Claude

### Implementing New Features

```text
Implement a REST API endpoint for user management using FastAPI. Include
CRUD operations for users, JWT authentication, Pydantic input validation,
specific error handling with status codes, tests for success, validation
errors, and auth failures, plus OpenAPI documentation.
```

### Fixing Issues

```text
Fix the async database connection pool issue in src/db/connection.py
where connections are not being released. The error occurs when running
concurrent requests. Use context managers and add tests for the fix.
```

### Refactoring

```text
Refactor the data processing module to use pandas DataFrames instead
of raw dictionaries. Maintain backward compatibility, improve performance
for large datasets, and add type hints throughout. Include benchmarks
comparing the old and new implementations.
```

### Performance Optimization

```text
Optimize the image processing pipeline in src/imaging/processor.py.
Profile the current implementation, identify bottlenecks, and improve
runtime using multiprocessing or async I/O where it applies. Target a
50% performance improvement.
```
