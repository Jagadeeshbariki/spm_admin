import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# The start of the wrongly injected code:
wrong_code_start = """      {/* Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">"""

wrong_code_end = """        )}
      </div>

    </div>
  );
}"""

correct_dashboard_end = """    </div>
  );
}"""

# Find the wrongly injected code inside CropsDashboard and remove it.
# We know it's right before `function FilterSelect`
# So we can search for the chunk between `      )}` (end of image modal) and `function FilterSelect`

match = re.search(r'(      \{/\* Image Preview Modal \*/\}.*?      \}\))(\s*\{/\* Summary Tables \*/\}.*?)(function FilterSelect)', content, re.DOTALL)
if match:
    # the second group is what we want to remove
    content = content[:match.end(1)] + "\n    </div>\n  );\n}\n\n" + content[match.start(3):]
    print("Fixed CropsDashboard end")
else:
    print("Could not find the wrongly injected code!")

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
