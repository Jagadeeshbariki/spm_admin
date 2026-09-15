import re

with open('src/pages/admin/BYPDashboard.tsx', 'r') as f:
    content = f.read()

# Fix the duplicate q in filteredData
content = content.replace("""      const q = String(item.Quarter || 'Unknown').trim();
      const q = String(item.Quarter || 'Unknown').trim();
      const stRaw""", """      const q = String(item.Quarter || 'Unknown').trim();
      const d = String(item.survey_date || 'Unknown').trim();
      const stRaw""")

# Let's double check if I broke the one in birdTrendData:
bird_check = """      // Trend
      const q = String(item.Quarter || 'Unknown').trim();
      const d = String(item.survey_date || 'Unknown').trim();
      const stRaw = String(item.service_info?.byp_service_type || '');"""

# I'll just restore the entire filteredData manually if it's messed up.
