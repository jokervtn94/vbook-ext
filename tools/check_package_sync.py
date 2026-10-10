"""Check that published ZIP scripts and manifest match committed source byte-for-byte.

Usage: python tools/check_package_sync.py manhuavn tranh18 novelbuddy sayhentai
"""
import sys
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
def check(folder):
    if folder in ("", ".", "..") or "/" in folder or "\\" in folder:
        raise ValueError(f"Invalid folder {folder!r}")
    directory=ROOT/folder
    with zipfile.ZipFile(directory/"plugin.zip") as archive:
        for local in sorted([directory/"plugin.json",directory/"icon.png",* (directory/"src").rglob("*")]):
            if not local.is_file() or "__pycache__" in local.parts: continue
            name=local.relative_to(directory).as_posix()
            try:
                shipped=archive.read(name)
            except KeyError:
                raise ValueError(f"{folder}: ZIP missing {name}")
            if shipped != local.read_bytes():
                raise ValueError(f"{folder}: ZIP contains stale {name}")
    print("PASS ZIP matches source:",folder)
if __name__=="__main__":
    try:
        for name in sys.argv[1:]:
            check(name)
    except (ValueError,OSError,zipfile.BadZipFile) as exc:
        print("FAIL",exc)
        sys.exit(1)
