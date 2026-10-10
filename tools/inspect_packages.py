#!/usr/bin/env python3
"""Inspect shipped ZIP layout and version without changing it.

Usage: python tools/inspect_packages.py 123truyen sachhayonline novelbuddy
"""
import argparse
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def inspect(folder):
    package = ROOT / folder / "plugin.zip"
    with zipfile.ZipFile(package) as archive:
        files = [p for p in archive.namelist() if not p.endswith("/")]
        manifests = [p for p in files if p == "plugin.json" or p.endswith("/plugin.json")]
        if not manifests:
            raise ValueError(f"{folder}: no plugin.json in archive")
        meta = json.loads(archive.read(manifests[0]).decode("utf-8"))["metadata"]
        print(f"{folder}: {len(files)} files; archive manifest={manifests[0]}; "
              f"version={meta.get('version')}; source={meta.get('source')}; "
              f"sample={files[:12]}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folders", nargs="*", default=["123truyen", "sachhayonline", "novelbuddy"])
    args = parser.parse_args()
    for folder in args.folders:
        if "/" in folder or "\\" in folder or folder in (".", ".."):
            parser.error("folder must be a direct extension directory")
        inspect(folder)


if __name__ == "__main__":
    main()
