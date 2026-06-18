import re

def fix_maps(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace data.someArray.map with (data.someArray || []).map
    # We only want to match properties of `data`.
    # Also handle data.someArray?.map just in case.
    fixed = re.sub(r'data\.([a-zA-Z0-9_]+)\.?map\(', r'(data.\1 || []).map(', content)

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(fixed)

    print("Fixed map calls in WebsiteManager.tsx")

fix_maps(r"e:\Digital Class\mit-paradh-main (1)\src\components\WebsiteManager.tsx")
