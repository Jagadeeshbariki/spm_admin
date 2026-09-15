with open('src/pages/admin/BYPDashboard.tsx', 'r') as f:
    content = f.read()

# Fix the incomeStats return block
content = content.replace(
"""      totalOwnConsumptionValue,
      totalEggConsumption,
      quarterlyTrendData,
      blockIncomeData,""",
"""      totalOwnConsumptionValue,
      totalEggConsumption,
      monthlyTrendData,
      blockIncomeData,"""
)

with open('src/pages/admin/BYPDashboard.tsx', 'w') as f:
    f.write(content)

