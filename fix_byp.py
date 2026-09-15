import re

with open('src/pages/admin/BYPDashboard.tsx', 'r') as f:
    content = f.read()

# Fix the duplicate declaration issue
fixed_content = content.replace(
"""      const d = String(item.survey_date || 'Unknown').trim();
      const stRaw = String(item.service_info?.byp_service_type || '');
      const stArr = stRaw.split(' ').map(s => s.trim()).filter(Boolean);
      const m = String(item.survey_date || '').substring(0, 7);
      
      if (b && b !== 'undefined' && b !== '-') blocks.add(b);""",
"""      const d = String(item.survey_date || 'Unknown').trim();
      
      if (b && b !== 'undefined' && b !== '-') blocks.add(b);"""
)

fixed_content = fixed_content.replace(
"""      const d = String(item.survey_date || 'Unknown').trim();
      const stRaw = String(item.service_info?.byp_service_type || '');
      const stArr = stRaw.split(' ').map(s => s.trim()).filter(Boolean);
      const m = String(item.survey_date || '').substring(0, 7);

      if (selectedBlock.length > 0 && !selectedBlock.includes(b)) return false;""",
"""      const d = String(item.survey_date || 'Unknown').trim();
      const stRaw = String(item.service_info?.byp_service_type || '');
      const stArr = stRaw.split(' ').map(s => s.trim()).filter(Boolean);
      const m = String(item.survey_date || '').substring(0, 7);

      if (selectedBlock.length > 0 && !selectedBlock.includes(b)) return false;"""
)

with open('src/pages/admin/BYPDashboard.tsx', 'w') as f:
    f.write(fixed_content)

print("Fixed duplicate declarations")
