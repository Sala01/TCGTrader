#!/usr/bin/env python3
"""
This script centralizes inline color values in all .tsx files within the project.
It replaces hex colour literals and some named colour strings with references to
the `COLORS` dictionary exported from `constants/GlobalStyles.ts`. It also injects
the necessary import statements into each file if they do not already exist.

Usage:
    python3 scripts/centralize_colors.py
"""
import os
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]

# Build a mapping from hex colour strings to keys in the COLORS object.
HEX_COLORS = {
    '#00B0FF': 'color00B0FF',
    '#0A0F1C': 'color0A0F1C',
    '#1C1C2E': 'color1C1C2E',
    '#ccc': 'colorCCC',
    '#fff': 'colorFFF',
    '#aaa': 'colorAAA',
    '#BFCED6': 'colorBFCED6',
    '#1C1C1C': 'color1C1C1C',
    '#FFB300': 'colorFFB300',
    '#FFFFFF': 'colorFFFFFF',
    '#888': 'color888',
    '#D32F2F': 'colorD32F2F',
    '#444': 'color444',
    '#000': 'color000',
    '#999': 'color999',
    '#777': 'color777',
    '#FF5252': 'colorFF5252',
    '#66BB6A': 'color66BB6A',
    '#00FFAA': 'color00FFAA',
    '#00C853': 'color00C853',
    '#ddd': 'colorDDD',
    '#FF5555': 'colorFF5555',
    '#FF4444': 'colorFF4444',
    '#AB47BC': 'colorAB47BC',
    '#666': 'color666',
    '#5F1C1C': 'color5F1C1C',
    '#42A5F5': 'color42A5F5',
    '#388E3C': 'color388E3C',
    '#333': 'color333',
    '#2A2A3F': 'color2A2A3F',
    '#151526': 'color151526',
    '#004D80': 'color004D80',

    # Additional colours discovered after the initial run. These were present in
    # components such as MostSoldSection, ActiveAuctions, ThemedText, LastSetBanner,
    # and SearchBar.
    '#00C8FF': 'color00C8FF',
    '#bbb': 'colorBBB',
    '#0A7EA4': 'color0A7EA4',
    '#00000088': 'color00000088',
    '#7ED8FF': 'color7ED8FF',
}

# Build an uppercase version of the hex colour map so that codes can be
# normalised before lookup. This allows both uppercase and lowercase colour
# literals (e.g. '#fff' and '#FFF') to be replaced with the same key.
HEX_COLORS_UPPER = {key.upper(): value for key, value in HEX_COLORS.items()}

# Named colours to map to COLORS properties.
NAMED_COLORS = {
    'white': 'white',
    'black': 'black',
    'gray': 'gray',
    'grey': 'grey',
    'red': 'red',
    'blue': 'blue',
}

def compute_import_path(file_path: Path) -> str:
    """
    Compute the relative import path to constants/GlobalStyles.ts from a given file.
    """
    # Determine how many directories deep this file is relative to the project root
    relative = file_path.relative_to(PROJECT_ROOT)
    # Number of parts minus filename
    depth = len(relative.parts) - 1
    # Build path up to root then down to constants/GlobalStyles
    parts = ['..'] * depth + ['constants', 'GlobalStyles']
    return os.path.join(*parts)

def process_file(file_path: Path):
    text = file_path.read_text()
    original = text
    if not file_path.name.endswith('.tsx'):
        return
    # Compute import path relative to current file
    import_path = compute_import_path(file_path)
    # Check if import is already present
    if f"from '{import_path}'" not in text and 'GlobalStyles' not in text and 'COLORS' not in text:
        # Insert after the last import statement
        match = list(re.finditer(r'^import .+$', text, re.MULTILINE))
        insert_index = match[-1].end() if match else 0
        import_line = f"\nimport {{ COLORS }} from '{import_path}';\n"
        text = text[:insert_index] + import_line + text[insert_index:]

    # Replace hex colour literals enclosed in single or double quotes
    def replace_hex(match):
        # Extract the colour code without surrounding quotes and normalise to
        # uppercase for lookup. The match includes the surrounding quotes as
        # part of the group.
        code = match.group(0)[1:-1]  # strip quotes
        key = HEX_COLORS_UPPER.get(code.upper())
        if key:
            return f"COLORS.{key}"
        return match.group(0)

    # Allow hex colour strings of length 3, 6 or 8 (e.g. '#FFF', '#00FFAA', '#FFAA00CC').
    text = re.sub(r"'#[0-9A-Fa-f]{3,8}'", replace_hex, text)
    text = re.sub(r'"#[0-9A-Fa-f]{3,8}"', replace_hex, text)

    # Replace named colours enclosed in single or double quotes
    def replace_named(match):
        """
        Replace named colour strings with a reference to the corresponding
        property on the COLORS object. Quotes around the colour literal are
        deliberately omitted so that the result is a valid identifier rather
        than a string literal (e.g. 'white' -> COLORS.white).
        """
        name = match.group(2)
        key = NAMED_COLORS.get(name)
        if key:
            return f"COLORS.{key}"
        return match.group(0)

    text = re.sub(r"(['\"])(white|black|gray|grey|red|blue)\1", replace_named, text)

    # Remove any quotes around colours that were replaced in a previous run. A prior
    # substitution might have introduced "'COLORS.white'" which is a string literal.
    # These patterns strip the surrounding quotes so that the identifier is used
    # directly. Both single and double quotes are handled.
    text = re.sub(r"'COLORS\.([A-Za-z0-9_]+)'", r"COLORS.\1", text)
    text = re.sub(r'"COLORS\.([A-Za-z0-9_]+)"', r"COLORS.\1", text)

    # Ensure JSX attributes reference the COLORS object using braces. During colour
    # substitution the quotes around colour strings are removed, which can leave
    # attributes like `color=COLORS.color00B0FF` (missing braces). In JSX the
    # value after `=` must be wrapped in braces to indicate a JavaScript
    # expression. This regex finds any attribute assignment using the pattern
    # `<attribute>=COLORS.<key>` and inserts braces around the value. The
    # attribute name (captured in group 1) is preserved.
    text = re.sub(r'(\b[A-Za-z0-9_]+)=COLORS\.([A-Za-z0-9_]+)', r'\1={COLORS.\2}', text)

    if text != original:
        file_path.write_text(text)

def main():
    """
    Walk the project tree and process all `.tsx` files to centralize colour
    definitions. Only a few directories (e.g. `node_modules` and `.expo`) are
    excluded to avoid rewriting bundled or third‑party code. Previously this
    script only modified files under the `app` or `screens` directories; now it
    applies to any TypeScript React file in the repository (such as those in
    `components`, `hooks`, etc.) so that colours defined inline anywhere in the
    codebase will be replaced with references to the global `COLORS` object.
    """
    # Traverse the entire project tree
    for root, dirs, files in os.walk(PROJECT_ROOT):
        # Skip directories that should never be processed
        for skip in ('node_modules', '.expo', 'android', 'ios'):
            if skip in dirs:
                dirs.remove(skip)
        for file in files:
            # Only process React Native TypeScript files
            if file.endswith('.tsx'):
                path = Path(root) / file
                process_file(path)

if __name__ == '__main__':
    main()