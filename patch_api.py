import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

target = """    const res = await fetch(`/api/drive/file/${encodeURIComponent(fileId)}`);
    if (!res.ok) throw new Error("Failed to fetch file");"""

replacement = """    const res = await fetch(`/api/drive/file/${encodeURIComponent(fileId)}`);
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch file: ${res.status} - ${errorText}`);
    }"""

content = content.replace(target, replacement)

with open('src/lib/api.ts', 'w') as f:
    f.write(content)
