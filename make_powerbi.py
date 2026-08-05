import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Change main wrapper
old_wrap = '    <div className="bg-[#F5F7FA] min-h-screen -m-4 md:-m-8 p-4 md:p-8 font-sans text-slate-800" style={{ overflowY: "scroll" }}>\n      <div className="max-w-7xl mx-auto space-y-6">'
new_wrap = '    <div className="bg-[#F5F7FA] h-[calc(100vh-64px)] -m-4 md:-m-8 p-4 md:p-8 font-sans text-slate-800 flex flex-col overflow-hidden">\n      <div className="max-w-7xl mx-auto w-full h-full flex flex-col gap-4">'
content = content.replace(old_wrap, new_wrap)

# Change overview tab h-[calc]
old_over = '<div className="flex flex-col h-[calc(100vh-230px)] gap-4">'
new_over = '<div className="flex flex-col flex-1 min-h-0 gap-4">'
content = content.replace(old_over, new_over)

# Change FRP table wrap
old_frp = '        ) : (\n          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">\n          <div className="overflow-x-auto custom-scrollbar">'
new_frp = '        ) : (\n          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">\n          <div className="overflow-auto custom-scrollbar flex-1 min-h-0">'
content = content.replace(old_frp, new_frp)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
