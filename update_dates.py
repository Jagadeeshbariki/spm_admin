import re

with open('src/pages/admin/BYPDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Overview Stats: birdTrendData
# From: const d = String(item.survey_date || 'Unknown').trim(); ... dateBirds[d] = ...
# To: const q = String(item.Quarter || 'Unknown').trim(); ... dateBirds[q] = ...
content = re.sub(
    r"const d = String\(item\.survey_date \|\| 'Unknown'\)\.trim\(\);\s*const stRaw",
    r"const q = String(item.Quarter || 'Unknown').trim();\n      const stRaw",
    content
)
content = re.sub(
    r"if \(d !== 'Unknown' && d !== 'null'\) {\s*dateBirds\[d\] = \(dateBirds\[d\] \|\| 0\) \+ \(isNaN\(birds\) \? 0 : birds\);\s*}",
    r"if (q !== 'Unknown' && q !== 'null') {\n        dateBirds[q] = (dateBirds[q] || 0) + (isNaN(birds) ? 0 : birds);\n      }",
    content
)

# 2. Health Stats: Vaccination & Deworming Dates
# From: const vm = vacDate ? String(vacDate).substring(0, 7) : String(item.survey_date).substring(0, 7);
# To: const vm = vacDate ? String(vacDate).trim() : String(item.survey_date).trim();
content = content.replace(
    "const vm = vacDate ? String(vacDate).substring(0, 7) : String(item.survey_date).substring(0, 7);",
    "const vm = vacDate && vacDate !== 'null' ? String(vacDate).trim() : 'Unknown';"
)
content = content.replace(
    "const dm = dewormDate ? String(dewormDate).substring(0, 7) : String(item.survey_date).substring(0, 7);",
    "const dm = dewormDate && dewormDate !== 'null' ? String(dewormDate).trim() : 'Unknown';"
)
# Update Health Chart Titles
content = content.replace(">Monthly Vaccination Trend<", ">Vaccination Trend<")
content = content.replace(">Monthly Deworming Trend<", ">Deworming Trend<")

# 3. Income Stats: monthlyIncome
# From: const m = String(item.survey_date || '').substring(0, 7);
# To: const m = String(item.Quarter || 'Unknown').trim();
income_m = r"const m = String\(item\.survey_date \|\| ''\)\.substring\(0, 7\);\s*if \(m && m !== 'undefin' && m !== 'null' && m !== 'Unknown'\) {\s*if \(!monthlyIncome\[m\]\)"
new_income_m = r"const m = String(item.Quarter || 'Unknown').trim();\n      if (m && m !== 'undefin' && m !== 'null' && m !== 'Unknown') {\n        if (!monthlyIncome[m])"
content = re.sub(income_m, new_income_m, content)

# 4. MIS Stats:
# maxMonth logic
mis_max = r"let maxMonth = '';\s*filteredData\.forEach\(item => {\s*const m = String\(item\.survey_date \|\| ''\)\.substring\(0, 7\);\s*if \(m && m !== 'undefin' && m !== 'null' && m > maxMonth\) maxMonth = m;\s*}\);\s*let subsThisMonth = 0;"
new_mis_max = r"let maxQuarter = '';\n    filteredData.forEach(item => {\n       const q = String(item.Quarter || '').trim();\n       if (q && q !== 'undefin' && q !== 'null' && q !== 'Unknown' && q > maxQuarter) maxQuarter = q;\n    });\n    let subsThisQuarter = 0;"
content = re.sub(mis_max, new_mis_max, content)

# loop logic
mis_loop = r"const d = String\(item\.survey_date \|\| 'Unknown'\)\.trim\(\);\s*const m = d\.substring\(0, 7\);"
new_mis_loop = r"const d = String(item.survey_date || 'Unknown').trim();\n      const m = String(item.Quarter || 'Unknown').trim();"
content = re.sub(mis_loop, new_mis_loop, content)

# if logic
mis_if = r"if \(m === maxMonth\) subsThisMonth\+\+;"
new_mis_if = r"if (m === maxQuarter) subsThisQuarter++;"
content = re.sub(mis_if, new_mis_if, content)

# Update return values
content = content.replace("subsThisMonth,", "subsThisQuarter,")
content = content.replace("Subs This Month", "Subs This Quarter")
content = content.replace("misStats.subsThisMonth.toLocaleString()", "misStats.subsThisQuarter.toLocaleString()")
content = content.replace(">Monthly Submissions<", ">Quarterly Submissions<")

# Update Chart Tooltip/Title for Overview
content = content.replace(">Bird Trend<", ">Bird Trend (by Quarter)<")

# Update Chart Tooltip/Title for Income
content = content.replace(">Income Over Time<", ">Income Over Time (by Quarter)<")
content = content.replace(">Income Comparison Over Time<", ">Income Comparison Over Time (by Quarter)<")

with open('src/pages/admin/BYPDashboard.tsx', 'w') as f:
    f.write(content)

print("Dates updated successfully!")
