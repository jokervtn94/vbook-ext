#!/usr/bin/env python3
"""Validate Vbook extension catalog paths without accessing the network."""

import argparse
import json
from pathlib import Path
from urllib.parse import urlsplit

DEFAULT_ROOT = Path(__file__).resolve().parent.parent
OWNER = "jokervtn94"
REPOSITORY = "vbook-ext"


def validate_asset_url(url, branch, filename):
    if not isinstance(url, str):
        return None, "not a string"
    parsed = urlsplit(url)
    expected_prefix = [OWNER, REPOSITORY, branch]
    parts = parsed.path.strip("/").split("/")
    if (
        parsed.scheme != "https"
        or parsed.netloc != "raw.githubusercontent.com"
        or parsed.query
        or parsed.fragment
        or len(parts) != 5
        or parts[:3] != expected_prefix
        or parts[-1] != filename
        or parts[3] in ("", ".", "..")
    ):
        return None, f"expected https://raw.githubusercontent.com/{OWNER}/{REPOSITORY}/{branch}/<folder>/{filename}"
    return parts[3], None


def validate(root, branch):
    errors = []
    warnings = []
    index = root / "plugin.json"

    try:
        catalog = json.loads(index.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        return [f"Cannot load {index}: {exc}"], warnings

    if not isinstance(catalog, dict) or not isinstance(catalog.get("data"), list):
        return ["plugin.json must be an object with a data array"], warnings

    seen_folders = set()
    for i, entry in enumerate(catalog["data"], start=1):
        prefix = f"data[{i}]"
        if not isinstance(entry, dict):
            errors.append(f"{prefix}: not a JSON object")
            continue
        if not isinstance(entry.get("name"), str) or not entry["name"].strip():
            errors.append(f"{prefix}: missing name")

        if entry.get("type") not in ("novel", "comic", "chinese_novel"):
            errors.append(f"{prefix}: missing/invalid type")
        if not isinstance(entry.get("locale"), str) or not entry["locale"].strip():
            errors.append(f"{prefix}: missing locale")

        folder, problem = validate_asset_url(entry.get("path"), branch, "plugin.zip")
        if problem:
            errors.append(f"{prefix}.path: {problem}")
            continue
        icon_folder, problem = validate_asset_url(entry.get("icon"), branch, "icon.png")
        if problem:
            errors.append(f"{prefix}.icon: {problem}")
        elif icon_folder != folder:
            errors.append(f"{prefix}: icon and ZIP point to different folders")

        if folder in seen_folders:
            errors.append(f"{prefix}: duplicate folder {folder}")
        seen_folders.add(folder)

        for filename in ("plugin.zip", "plugin.json", "icon.png"):
            if not (root / folder / filename).is_file():
                errors.append(f"{prefix}: missing {folder}/{filename}")

    all_folders = {
        item.parent.name for item in root.glob("*/plugin.json") if item.is_file()
    }
    for folder in sorted(all_folders - seen_folders):
        warnings.append(f"Unlisted extension (kept unchanged): {folder}")
    return errors, warnings


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=DEFAULT_ROOT)
    parser.add_argument("--branch", default="master")
    args = parser.parse_args()

    errors, warnings = validate(args.repo_root.resolve(), args.branch)
    for item in warnings:
        print(f"WARNING: {item}")
    for item in errors:
        print(f"ERROR: {item}")
    if errors:
        print(f"FAILED: {len(errors)} catalog error(s).")
        return 1
    print("PASS: catalog URLs and local asset paths are consistent.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
