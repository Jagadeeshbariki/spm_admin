import re

with open('src/pages/admin/BYPDashboard.tsx', 'r') as f:
    content = f.read()

# Update variable names and logic in populationStats
content = content.replace(
    "const monthlyTrend: Record<string, { added: number, sold: number, meat: number }> = {};",
    "const quarterlyTrend: Record<string, { added: number, sold: number, meat: number }> = {};"
)

content = content.replace(
    """      const m = String(item.survey_date || '').substring(0, 7);
      if (m && m !== 'undefin' && m !== 'null' && m !== 'Unknown') {
        if (!monthlyTrend[m]) monthlyTrend[m] = { added: 0, sold: 0, meat: 0 };
        monthlyTrend[m].added += added;
        monthlyTrend[m].sold += sold;
        monthlyTrend[m].meat += meatKgs;
      }""",
    """      const q = String(item.Quarter || 'Unknown').trim();
      if (q && q !== 'undefined' && q !== 'null' && q !== 'Unknown') {
        if (!quarterlyTrend[q]) quarterlyTrend[q] = { added: 0, sold: 0, meat: 0 };
        quarterlyTrend[q].added += added;
        quarterlyTrend[q].sold += sold;
        quarterlyTrend[q].meat += meatKgs;
      }"""
)

content = content.replace(
    """    const monthlyTrendData = Object.entries(monthlyTrend)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a,b) => a.date.localeCompare(b.date));""",
    """    const quarterlyTrendData = Object.entries(quarterlyTrend)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a,b) => a.date.localeCompare(b.date));"""
)

content = content.replace(
    "      monthlyTrendData,",
    "      quarterlyTrendData,"
)

# Update JSX references on Page 5
content = content.replace(
    "populationStats.monthlyTrendData",
    "populationStats.quarterlyTrendData"
)

with open('src/pages/admin/BYPDashboard.tsx', 'w') as f:
    f.write(content)

print("Updated Page 5 to use Quarter for trends!")
