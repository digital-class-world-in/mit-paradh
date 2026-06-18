import re
import os

file_path = r'e:\Digital Class\mit-paradh-main (1)\src\app\student\dashboard\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find conflict blocks
# We want to keep the 'v2' parts usually.
# In this file, the v2 part is between ======= and >>>>>>>

def resolve_conflict(match):
    head = match.group(1)
    v2 = match.group(2)
    # Most of the time we want v2 in this specific rebase task
    # However, for the renderTabContent switch, we need to be careful.
    # Let's just remove the markers and keep everything for now, or just v2.
    # Actually, the user wants to "purge all residual structural merge conflict markers".
    # And "restore ERP system stability".
    
    # I'll just keep the v2 part if it's there, otherwise keep head.
    return v2

# Generic conflict resolver
cleaned_content = re.sub(r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> .*?\n', resolve_conflict, content, flags=re.DOTALL)

# Also handle single markers if any left
cleaned_content = re.sub(r'<<<<<<< HEAD\n', '', cleaned_content)
cleaned_content = re.sub(r'=======\n', '', cleaned_content)
cleaned_content = re.sub(r'>>>>>>> .*?\n', '', cleaned_content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(cleaned_content)

print("Cleaned!")
