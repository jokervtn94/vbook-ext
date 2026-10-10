#!/usr/bin/env python3
"""Inspect shipped ZIP layout and version without changing it.

Usage:
    python tools/inspect_packages.py                 # all published extensions
    python tools/inspect_packages.py novelbuddy      # selected extension(s)
"""
import argparse
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def published_folders():
    catalog = json.loads((ROOT / "plugin.json").read_text(encoding="utf-8"))
    folders = []
    for entry in catalog["data"]:
        # Asset URL shape is independently validated by validate_extensions.py.
        folder = entry["path"].split("/")[-2]
        if folder not in folders:
            folders.append(folder)
    return folders


def inspect(folder):
    package = ROOT / folder / "plugin.zip"
    with zipfile.ZipFile(package) as archive:
        files = [p for p in archive.namelist() if not p.endswith("/")]
        manifests = [p for p in files if p == "plugin.json" or p.endswith("/plugin.json")]
        if not manifests:
            raise ValueError(f"{folder}: no plugin.json in archive")
        meta = json.loads(archive.read(manifests[0]).decode("utf-8"))["metadata"]
        local_meta = json.loads((ROOT / folder / "plugin.json").read_text(encoding="utf-8"))["metadata"]
        if meta.get("version") != local_meta.get("version"):
            raise ValueError(f"{folder}: ZIP version differs from source manifest")
        print(f"{folder}: {len(files)} files; archive manifest={manifests[0]}; "
              f"version={meta.get('version')}; source={meta.get('source')}; "
              f"sample={files[:12]}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folders", nargs="*", help="Extension folders; default: all published")
    args = parser.parse_args()
    folders = args.folders or published_folders()
    for folder in folders:
        if "/" in folder or "\\" in folder or folder in (".", ".."):
            parser.error("folder must be a direct extension directory")
        inspect(folder)
    print(f"PASS: inspected {len(folders)} published package(s).")


if __name__ == "__main__":
    main()
