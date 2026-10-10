#!/usr/bin/env python3
"""Recover missing (not existing) extension JS source from its published ZIP.

Default is a read-only preview. --apply restores UTF-8 files listed in each
plugin.json script map, never overwrites an existing source file and never
extracts arbitrary ZIP entries or paths.
"""
import argparse
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ALLOWED = ("omegascans",)


def recover(folder, apply):
    directory = ROOT / folder
    manifest = json.loads((directory / "plugin.json").read_text("utf-8"))
    scripts = manifest["script"]
    with zipfile.ZipFile(directory / "plugin.zip") as archive:
        members = [name for name in archive.namelist() if not name.endswith("/")]
        for key, basename in scripts.items():
            if not isinstance(basename, str) or not basename.endswith(".js") or "/" in basename or "\\" in basename:
                raise ValueError(f"Unsafe script filename: {key}={basename!r}")
            target = directory / "src" / basename
            if target.exists():
                continue
            choices = [name for name in members if
                       name == basename or name == f"src/{basename}" or
                       name.endswith(f"/src/{basename}")]
            if len(choices) != 1:
                raise ValueError(f"{folder}/{basename}: expected exactly one matching archive entry, got {choices}")
            info = archive.getinfo(choices[0])
            if info.file_size > 1024 * 1024:
                raise ValueError(f"{folder}/{basename}: archive entry too large")
            raw = archive.read(choices[0])
            code = raw.decode("utf-8")
            print(f"{'RESTORE' if apply else 'WOULD RESTORE'}: {target.relative_to(ROOT)} ({len(raw)} bytes)")
            if apply:
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(raw)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Restore missing files from ZIP")
    args = parser.parse_args()
    for folder in ALLOWED:
        recover(folder, args.apply)
    print("Source recovery complete; existing files untouched.")


if __name__ == "__main__":
    main()
