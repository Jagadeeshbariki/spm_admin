import re
import os

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

old_button = """            <button 
              className="absolute -top-12 right-0 md:-right-12 text-white/70 hover:text-white p-2 transition-colors bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md"
              onClick={(e) => {"""

new_button = """            <button 
              className="fixed top-4 right-4 z-[5010] text-white/70 hover:text-white p-2 transition-colors bg-slate-900/50 hover:bg-slate-900/80 rounded-full backdrop-blur-md ring-1 ring-white/20"
              onClick={(e) => {"""

content = content.replace(old_button, new_button)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

