# Python Practices Reference

Read this after the repository’s own instructions. If local `AGENTS.md`, `README.md`, `pyproject.toml`, `setup.cfg`, or existing code disagree with this file, follow the repository.

## Runtime

Run Python applications and tests from a virtual environment. Check for an existing `.env` before adding one. Put secrets in `.env`, not in source files. When a command depends on interpreter choice, file encoding, or a timeout, spell that out in the command or code.

```bash
python -m venv .venv
source .venv/bin/activate
python -m pytest
```

## Error boundaries

Raise errors that name the failure. Catch an exception only when the current function can recover or add useful context. Re-raise with `from error` so the original traceback stays attached. Use `with` for resource lifetimes: files, locks, temporary workspaces, sockets, database sessions.

```python
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

class DataProcessingError(Exception):
    """Raised when a data file cannot be processed."""

@contextmanager
def read_text(path: Path) -> Iterator[str]:
    try:
        yield path.read_text(encoding="utf-8")
    except FileNotFoundError as error:
        raise DataProcessingError(f"Missing input file: {path}") from error
```

## Types and validation

Annotate public callables. Also annotate constructors and constants exported at module scope. Use `list[str]`, `dict[str, object]`, and similar built-in generics unless the project still supports older Python. Validate data when it crosses a trust boundary such as a CLI argument, HTTP payload, environment variable, file, database row, or external service response. Use dataclasses or Pydantic when that matches nearby code.

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Result:
    names: list[str]
    skipped_count: int

def extract_names(rows: list[dict[str, object]], key: str) -> Result:
    if key == "":
        raise ValueError("key must not be empty")

    names = [str(row[key]) for row in rows if key in row]
    skipped_count = len(rows) - len(names)
    return Result(names=names, skipped_count=skipped_count)
```

## Concurrency

Use `asyncio` for concurrent I/O in projects that already have async code. Keep CPU-heavy work out of the event loop. Use worker processes, a queue, or the project’s job system for that work. Threads are acceptable around blocking I/O libraries that lack async APIs. Set cancellation and timeout behavior explicitly.

```python
async def fetch_json(session: object, url: str, timeout_s: float) -> dict[str, object]:
    async with session.get(url, timeout=timeout_s) as response:
        return await response.json()
```

## Configuration

Read configuration near process startup, validate it there, then pass a settings object to code that needs it. Avoid `os.environ` reads inside business logic. Name feature flags after the behavior they control.

## Layout and names

Follow the layout already present. For a new package, prefer `src/<package_name>/` with tests under `tests/`. Put CLI entry points in `__main__.py` or a small command module. Keep business logic importable without starting the CLI. Use `snake_case.py` for Python files and `test_*.py` for tests.

## Documentation and comments

Write docstrings for public modules and classes. Add them to functions, fixtures, and test helpers when the name does not explain the purpose. State the contract: what the object does, what arguments matter, what it returns, and what it may raise. Keep comments for surprising decisions. Delete comments that repeat the code.

## Logging

Use the project’s logger setup. If none exists, create loggers with `logging.getLogger(__name__)`. Include IDs, file paths, counts, retry numbers, and other fields needed to debug the event. Do not log secrets, tokens, passwords, cookies, or raw customer data. Avoid expensive log formatting unless the message will be emitted.

```python
logger.info("Imported users", extra={"path": str(path), "count": imported_count})
```

## Tests

Use pytest when the repository already uses it. Add tests near the code you changed. Name the behavior under test and assert results visible to a caller. Mock external systems such as HTTP, queues, clocks, and databases; avoid mocks between functions in the same small module. Property tests fit parsers, serializers, validators, and numeric code.

## Performance

Measure before optimizing. Use `cProfile`, `time.perf_counter()`, database query logs, or a benchmark that matches the slow path. Cache pure work or work with clear invalidation. Stream large inputs with generators. Use NumPy, Pandas, or database-side work only when the project already depends on them and the data shape justifies it.

## Security

Validate input before using it in file paths, shell commands, SQL, templates, or network requests. Use parameterized database queries. Generate tokens with `secrets`. Hash passwords with a password-hashing library instead of raw hashes. Keep dependencies new enough to receive security fixes, and do not add a package for a trivial helper.

```python
import secrets

def generate_token() -> str:
    return secrets.token_urlsafe(32)
```

## Tooling

Run the formatter, linter, type checker, and tests that the repository defines. Common tools include Black or Ruff for formatting, Ruff or Flake8 for linting, mypy or pyright for type checking, pytest for tests, coverage for reports, and pre-commit for local hooks. Do not introduce a new toolchain unless the task requires it.

## Agent workflow

For a Python change: read repository guidance, activate or create a virtual environment, make the smallest change that solves the task, update tests, run the relevant checks, and report any failing command with the exact error that remains.
