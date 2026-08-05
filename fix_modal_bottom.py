import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    lines = f.readlines()

output_lines = []
modal_count = 0
skip = False

for line in lines:
    if '{/* Image Preview Modal */}' in line:
        modal_count += 1
        if modal_count == 2:
            skip = True
    
    if not skip:
        output_lines.append(line)
        
    if skip and '}' in line and len(line.strip()) == 1 and output_lines[-1].strip() == '  );':
        pass # end of file

# Re-append the closing brackets if needed
if skip:
    output_lines.append('    </div>\n')
    output_lines.append('  );\n')
    output_lines.append('}\n')

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.writelines(output_lines)

