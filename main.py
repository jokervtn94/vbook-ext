"""Generate a portable README from the extension catalog.

Usage:
    python main.py           # update README.md
    python main.py --check   # verify README.md is up to date
"""

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CATALOG = ROOT / "plugin.json"
README = ROOT / "README.md"
CATALOG_URL = "https://raw.githubusercontent.com/jokervtn94/vbook-ext/master/plugin.json"


def cell(value):
    """Escape table cells without altering catalog metadata."""
    text = str(value if value not in (None, "") else "-")
    return text.replace("|", r"\|").replace("\r", " ").replace("\n", " ")


def render_readme(catalog):
    items = catalog["data"]
    if not isinstance(items, list):
        raise ValueError("plugin.json: 'data' must be a list")

    lines = [
        "## Vbook Extensions",
        "",
        "Extensions cho app Vbook App.",
        "",
        "Tải app tại: [Vbook App Download](https://bit.ly/vbookapp)",
        "",
        "## Link extension",
        "",
        CATALOG_URL,
        "",
        "## Danh sách extension",
        "",
        "| Name | Source | Version | Lang | Type |",
        "|------|--------|---------|------|------|",
    ]
    for item in items:
        lines.append(
            "| " + " | ".join(cell(item.get(key)) for key in (
                "name", "source", "version", "locale", "type"
            )) + " |"
        )
    lines.extend([
        "",
        "## Hướng dẫn cài đặt",
        "",
        "1. Mở phần mở rộng trong app.",
        "2. Chọn quản lý Extension URL.",
        "3. Thêm URL danh mục dưới đây:",
        "",
        "~~~text",
        CATALOG_URL,
        "~~~",
        "",
        "![Mở extension](huongdan/extension.jpg)",
        "![Thêm URL](huongdan/add.jpg)",
        "![Hoàn tất](huongdan/adds.jpg)",
        "",
    ])
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="Check README.md without changing it")
    args = parser.parse_args()
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    output = render_readme(catalog)

    if args.check:
        if not README.exists() or README.read_text(encoding="utf-8") != output:
            parser.exit(1, "README.md is out of date. Run: python main.py\n")
        print("README.md is up to date.")
    else:
        README.write_text(output, encoding="utf-8")
        print(f"Updated {README}")


if __name__ == "__main__":
    main()
