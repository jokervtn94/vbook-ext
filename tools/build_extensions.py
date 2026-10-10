#!/usr/bin/env python3
"""Build selected Vbook plugin.zip files reproducibly from source.

Never bulk-overwrite packages. Folders are explicit positional arguments.
Run: python tools/build_extensions.py 123truyen sachhayonline --apply
"""
import argparse
import io
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATE = (1980, 1, 1, 0, 0, 0)


def build(folder):
    if not folder or "/" in folder or "\\" in folder or folder in (".", ".."):
        raise ValueError(f"Invalid extension folder: {folder!r}")
    directory = ROOT / folder
    manifest_path = directory / "plugin.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    scripts = manifest.get("script")
    if not isinstance(scripts, dict):
        raise ValueError(f"{folder}: missing script map")

    required = {"plugin.json", "icon.png"}
    for key, name in scripts.items():
        if not isinstance(name, str) or "/" in name or "\\" in name or not name.endswith(".js"):
            raise ValueError(f"{folder}: unsafe script filename for {key}: {name!r}")
        required.add("src/" + name)

    files = [manifest_path, directory / "icon.png"]
    src_dir = directory / "src"
    if src_dir.is_dir():
        files.extend(p for p in src_dir.rglob("*") if p.is_file()
                     and "__pycache__" not in p.parts)
    rels = {p.relative_to(directory).as_posix(): p for p in files}
    missing = sorted(required - rels.keys())
    if missing:
        raise ValueError(f"{folder}: missing source files: {missing}")

    data = io.BytesIO()
    with zipfile.ZipFile(data, "w", compression=zipfile.ZIP_DEFLATED,
                         compresslevel=9) as z:
        for arcname in sorted(rels):
            info = zipfile.ZipInfo(arcname, DATE)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            z.writestr(info, rels[arcname].read_bytes(), compress_type=zipfile.ZIP_DEFLATED,
                       compresslevel=9)
    blob = data.getvalue()
    with zipfile.ZipFile(io.BytesIO(blob)) as archive:
        assert set(archive.namelist()) == set(rels)
        assert json.loads(archive.read("plugin.json"))["metadata"]["version"] == manifest["metadata"]["version"]
        assert archive.testzip() is None
    return blob, len(rels), manifest["metadata"]["version"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folders", nargs="+", help="Explicit extension folders to package")
    parser.add_argument("--apply", action="store_true", help="Write plugin.zip files")
    args = parser.parse_args()
    for folder in args.folders:
        package, files, version = build(folder)
        target = ROOT / folder / "plugin.zip"
        print(f"{'BUILD' if args.apply else 'PREVIEW'}: {folder}: "
              f"version={version}, {files} files, {len(package)} ZIP bytes")
        if args.apply:
            target.write_bytes(package)


if __name__ == "__main__":
    main()
