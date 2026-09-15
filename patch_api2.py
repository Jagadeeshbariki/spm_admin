import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

target = """export async function fetchFileContent(fileId: string) {
  try {
    const res = await fetch(`/api/drive/file/${encodeURIComponent(fileId)}`);"""

replacement = """export async function fetchFileContent(fileId: string) {
  try {
    const cleanId = fileId.trim();
    console.log(`Fetching file content for ID: "${cleanId}"`);
    const res = await fetch(`/api/drive/file/${encodeURIComponent(cleanId)}`);"""

content = content.replace(target, replacement)

with open('src/lib/api.ts', 'w') as f:
    f.write(content)
