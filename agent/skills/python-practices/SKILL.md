---
name: python-practices
description: Python coding standards and workflow. Use when working in Python repositories or files such as .py, .pyi, .ipynb, pyproject.toml, requirements.txt, setup.py, setup.cfg, pytest.ini, tox.ini, Pipfile, poetry.lock, uv.lock, or when the user asks about Python, pytest, mypy, FastAPI, Django, Flask, Pydantic, packaging, virtualenv, pip, Poetry, or uv.
---

# Python Practices

Use this skill for Python implementation, refactoring, debugging, code review, scripting, packaging, and project setup.

## Instructions

1. Inspect repo-specific guidance first. Check local `AGENTS.md`, `README.md`, `pyproject.toml`, `setup.cfg`, `requirements*.txt`, and nearby existing Python code. Treat repo conventions as higher priority than this skill.
2. Before changing Python code, read and apply [the canonical Python practices reference](../../../PYTHON.md).
3. Use only the sections relevant to the task. Do not force tools, file layouts, or frameworks that the repository does not already use.
4. When behavior changes, add or update tests that match the repo's test setup. Prefer pytest when the repo uses it.
5. Follow the repo's formatter, linter, and type checker when present. If the repo does not specify them, fall back to the reference guidance.
6. If you intentionally deviate from this reference because the project already uses a different convention, follow the project and briefly note the deviation when helpful.
