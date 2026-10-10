"""Non-destructive audit of local Vbook extensions.

This tool NEVER deletes source folders or rewrites plugin.json.
Run with --online to also probe websites (network failures are inconclusive).
"""

import argparse
import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent


def probe(url, timeout):
    """Try HEAD, then GET for servers that reject HEAD."""
    for method in ("HEAD", "GET"):
        try:
            req = Request(url, method=method, headers={"User-Agent": "Mozilla/5.0"})
            with urlopen(req, timeout=timeout) as response:
                return f"HTTP {response.status}"
        except (HTTPError, URLError, TimeoutError, ValueError) as exc:
            last_error = exc
    return f"UNCONFIRMED ({last_error})"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--online", action="store_true",
                        help="Probe website sources; no files will be modified")
    parser.add_argument("--timeout", type=float, default=8.0,
                        help="Timeout per HTTP request in seconds (default: 8)")
    args = parser.parse_args()
    if args.timeout <= 0:
        parser.error("--timeout must be positive")

    catalog = json.loads((ROOT / "plugin.json").read_text(encoding="utf-8"))
    errors = 0
    for entry in catalog["data"]:
        asset_url = entry.get("path", "")
        parts = urlsplit(asset_url).path.strip("/").split("/")
        folder = parts[-2] if len(parts) >= 2 else ""
        if not folder or folder in (".", ".."):
            print(f"[ERROR] Invalid asset path: {asset_url}")
            errors += 1
            continue

        plugin_file = ROOT / folder / "plugin.json"
        zip_file = ROOT / folder / "plugin.zip"
        if not plugin_file.is_file() or not zip_file.is_file():
            print(f"[ERROR] Missing plugin.json or plugin.zip: {folder}")
            errors += 1
            continue
        try:
            metadata = json.loads(plugin_file.read_text(encoding="utf-8")).get(
                "metadata", {}
            )
        except (OSError, ValueError) as exc:
            print(f"[ERROR] {plugin_file}: {exc}")
            errors += 1
            continue

        source = metadata.get("source")
        if not source:
            print(f"[WARN] {folder}: no source website")
            continue
        status = probe(source, args.timeout) if args.online else "not checked"
        print(f"[OK] {folder}: {source} ({status})")

    print(f"Audit complete. {errors} local problem(s). No files were changed.")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
