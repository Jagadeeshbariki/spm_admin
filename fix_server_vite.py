import re

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace("import { createServer as createViteServer } from 'vite';", "")

old_vite = """    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });"""

new_vite = """    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });"""

content = content.replace(old_vite, new_vite)

with open('server.ts', 'w') as f:
    f.write(content)

