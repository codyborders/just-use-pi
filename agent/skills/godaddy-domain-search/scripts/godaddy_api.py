#!/usr/bin/env python3
"""GoDaddy Domain Availability and Appraisal API client.

Queries the GoDaddy API for domain availability and estimated value.
Uses only Python standard library -- no external dependencies required.

Usage:
    python3 godaddy_api.py --domains "example.com,test.net" --env-file .env
    python3 godaddy_api.py --domains "example.com" --env-file /path/to/.env --batch-delay 5
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

GODADDY_BASE_URL = "https://api.godaddy.com"
AVAILABILITY_ENDPOINT = "/v1/domains/available"
APPRAISAL_ENDPOINT = "/v1/appraisal"

# GoDaddy rate limits: 60/min availability, 20/min appraisal.
DEFAULT_BATCH_DELAY_SECONDS = 3


def parse_env_file(env_file_path):
    """Parse a .env file and return a dictionary of key-value pairs.

    Handles quoted values, inline comments, and blank lines.
    Raises FileNotFoundError if the file does not exist.
    Raises ValueError if required keys are missing.
    """
    if not os.path.isfile(env_file_path):
        raise FileNotFoundError(f"Environment file not found: {env_file_path}")

    env_vars = {}
    with open(env_file_path, "r") as handle:
        for line_number, raw_line in enumerate(handle, start=1):
            line = raw_line.strip()
            if not line:
                continue
            if line.startswith("#"):
                continue

            if "=" not in line:
                continue

            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip()

            # Strip surrounding quotes from value.
            if len(value) >= 2:
                if (value[0] == '"' and value[-1] == '"') or (
                    value[0] == "'" and value[-1] == "'"
                ):
                    value = value[1:-1]

            # Remove inline comments (only outside quoted values).
            if " #" in value:
                value = value[: value.index(" #")].strip()

            env_vars[key] = value

    return env_vars


def validate_credentials(env_vars):
    """Validate that required GoDaddy API credentials exist.

    Returns a tuple of (api_key, api_secret).
    Raises ValueError if either credential is missing or empty.
    """
    api_key = env_vars.get("GODADDY_API_KEY", "").strip()
    api_secret = env_vars.get("GODADDY_API_SECRET", "").strip()

    if not api_key:
        raise ValueError("GODADDY_API_KEY is missing or empty in the .env file")
    if not api_secret:
        raise ValueError("GODADDY_API_SECRET is missing or empty in the .env file")

    return api_key, api_secret


def build_auth_header(api_key, api_secret):
    """Build the GoDaddy API authorization header value."""
    return f"sso-key {api_key}:{api_secret}"


def query_availability(domain, auth_header):
    """Query the GoDaddy Domain Availability endpoint.

    Returns a dictionary with availability status and price, or an error.
    """
    url = f"{GODADDY_BASE_URL}{AVAILABILITY_ENDPOINT}?domain={domain}&checkType=FAST&forTransfer=false"
    request = urllib.request.Request(
        url,
        headers={
            "Authorization": auth_header,
            "Accept": "application/json",
        },
        method="GET",
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            data = json.loads(response.read().decode("utf-8"))
            return {
                "available": data.get("available", False),
                "registration_price": data.get("price"),
                "currency": data.get("currency", "USD"),
                "definitive": data.get("definitive", False),
                "error": None,
            }
    except urllib.error.HTTPError as http_error:
        error_body = ""
        try:
            error_body = http_error.read().decode("utf-8")
        except Exception:
            pass  # Cannot read error body; use status code alone.

        status_code = http_error.code
        if status_code == 401:
            error_message = "Invalid API credentials (401 Unauthorized)"
        elif status_code == 422:
            error_message = f"Invalid domain format (422): {domain}"
        elif status_code == 429:
            error_message = "Rate limit exceeded (429). Increase --batch-delay."
        else:
            error_message = f"HTTP {status_code}: {error_body[:200]}"

        return {"available": None, "registration_price": None, "currency": None, "definitive": False, "error": error_message}
    except urllib.error.URLError as url_error:
        return {"available": None, "registration_price": None, "currency": None, "definitive": False, "error": f"Network error: {url_error.reason}"}
    except Exception as unexpected_error:
        return {"available": None, "registration_price": None, "currency": None, "definitive": False, "error": f"Unexpected error: {unexpected_error}"}


def query_appraisal(domain, auth_header):
    """Query the GoDaddy Domain Appraisal endpoint.

    Returns a dictionary with the GoValue estimate, or an error.
    """
    url = f"{GODADDY_BASE_URL}{APPRAISAL_ENDPOINT}/{domain}"
    request = urllib.request.Request(
        url,
        headers={
            "Authorization": auth_header,
            "Accept": "application/json",
        },
        method="GET",
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            data = json.loads(response.read().decode("utf-8"))
            return {
                "govalue": data.get("govalue"),
                "govalue_currency": "USD",
                "error": None,
            }
    except urllib.error.HTTPError as http_error:
        status_code = http_error.code
        if status_code == 401:
            error_message = "Invalid API credentials (401 Unauthorized)"
        elif status_code == 404:
            error_message = f"No appraisal available for {domain}"
        elif status_code == 429:
            error_message = "Rate limit exceeded (429). Increase --batch-delay."
        else:
            error_body = ""
            try:
                error_body = http_error.read().decode("utf-8")
            except Exception:
                pass
            error_message = f"HTTP {status_code}: {error_body[:200]}"

        return {"govalue": None, "govalue_currency": None, "error": error_message}
    except urllib.error.URLError as url_error:
        return {"govalue": None, "govalue_currency": None, "error": f"Network error: {url_error.reason}"}
    except Exception as unexpected_error:
        return {"govalue": None, "govalue_currency": None, "error": f"Unexpected error: {unexpected_error}"}


def validate_domain_format(domain):
    """Basic domain format validation.

    Returns True if the domain looks valid, False otherwise.
    Does not check DNS or registration status.
    """
    if not domain:
        return False
    if "." not in domain:
        return False

    parts = domain.split(".")
    if len(parts) < 2:
        return False

    # Each label must be 1-63 characters, alphanumeric plus hyphens.
    for part in parts:
        if not part:
            return False
        if len(part) > 63:
            return False
        if part.startswith("-") or part.endswith("-"):
            return False

    # TLD must be at least 2 characters.
    tld = parts[-1]
    if len(tld) < 2:
        return False

    return True


def analyze_domain(domain, auth_header, batch_delay_seconds):
    """Analyze a single domain: availability + appraisal.

    Returns a result dictionary for this domain.
    """
    assert validate_domain_format(domain), f"Invalid domain format: {domain}"

    availability = query_availability(domain, auth_header)
    # Respect rate limits between calls.
    time.sleep(max(1, batch_delay_seconds // 2))
    appraisal = query_appraisal(domain, auth_header)

    # Merge availability and appraisal errors.
    errors = []
    if availability["error"]:
        errors.append(f"availability: {availability['error']}")
    if appraisal["error"]:
        errors.append(f"appraisal: {appraisal['error']}")

    combined_error = "; ".join(errors) if errors else None

    return {
        "domain": domain,
        "available": availability["available"],
        "registration_price": availability["registration_price"],
        "govalue": appraisal["govalue"],
        "govalue_currency": appraisal["govalue_currency"],
        "error": combined_error,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Query GoDaddy API for domain availability and appraisal.",
    )
    parser.add_argument(
        "--domains",
        required=True,
        help="Comma-separated list of domains to analyze (e.g., 'example.com,test.net')",
    )
    parser.add_argument(
        "--env-file",
        required=True,
        help="Path to .env file containing GODADDY_API_KEY and GODADDY_API_SECRET",
    )
    parser.add_argument(
        "--batch-delay",
        type=int,
        default=DEFAULT_BATCH_DELAY_SECONDS,
        help=f"Seconds to wait between domain queries (default: {DEFAULT_BATCH_DELAY_SECONDS})",
    )

    args = parser.parse_args()

    # Parse and validate credentials.
    try:
        env_vars = parse_env_file(args.env_file)
        api_key, api_secret = validate_credentials(env_vars)
    except (FileNotFoundError, ValueError) as credential_error:
        error_output = {"results": [], "error": str(credential_error)}
        print(json.dumps(error_output, indent=2))
        sys.exit(1)

    auth_header = build_auth_header(api_key, api_secret)

    # Parse domain list.
    raw_domains = [domain.strip() for domain in args.domains.split(",")]
    domains = [domain for domain in raw_domains if domain]

    if not domains:
        error_output = {"results": [], "error": "No domains provided"}
        print(json.dumps(error_output, indent=2))
        sys.exit(1)

    # Validate all domains before making any API calls.
    invalid_domains = [domain for domain in domains if not validate_domain_format(domain)]
    if invalid_domains:
        print(
            json.dumps(
                {
                    "results": [],
                    "error": f"Invalid domain format: {', '.join(invalid_domains)}",
                },
                indent=2,
            )
        )
        sys.exit(1)

    # Analyze each domain.
    results = []
    for index, domain in enumerate(domains):
        result = analyze_domain(domain, auth_header, args.batch_delay)
        results.append(result)

        # Wait between domains (skip after the last one).
        is_last_domain = index == len(domains) - 1
        if not is_last_domain:
            time.sleep(args.batch_delay)

    output = {"results": results, "error": None}
    print(json.dumps(output, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()
