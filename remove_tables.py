import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

start_str = r"\{\/\*\s*Summary Tables\s*\*\/\}"
match = re.search(start_str, content)
if match:
    start_idx = match.start()
    end_idx = content.find("    </div>\n  );\n}", start_idx)
    if end_idx != -1:
        # replace everything from start_idx to end_idx with just the closing tags
        new_content = content[:start_idx] + "    </div>\n  );\n}" + content[end_idx + len("    </div>\n  );\n}"):]
        with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
            f.write(new_content)
        print("Removed summary tables.")
    else:
        print("Could not find end of OverviewTab.")
else:
    print("Could not find Summary Tables.")
