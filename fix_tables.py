import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Pattern to find the injected code in CropsDashboard
pattern = r'(      \{/\* Image Preview Modal \*/\}.*?      \}\))(.*?)(function FilterSelect)'
match = re.search(pattern, content, re.DOTALL)

if match:
    injected_code = match.group(2)
    # Restore CropsDashboard to have correct end
    content = content[:match.end(1)] + "\n    </div>\n  );\n}\n\n" + content[match.start(3):]
    
    # Now find the end of OverviewTab
    overview_end_pattern = r'(            </ul>\s*          </div>\s*        </div>\s*      \)\}\s*)(    </div>\s*  \);\s*\})'
    
    overview_match = re.search(overview_end_pattern, content, re.DOTALL)
    if overview_match:
        content = content[:overview_match.start(2)] + injected_code + overview_match.group(2) + content[overview_match.end(2):]
        print("Successfully moved tables to OverviewTab")
    else:
        print("Failed to find OverviewTab end")
else:
    print("Failed to find injected code")

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

