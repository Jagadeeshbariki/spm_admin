import re

with open('server.ts', 'r') as f:
    content = f.read()

# Make it export the app for Vercel
old_start = """async function startServer() {
  if (process.env.NODE_ENV !== 'production') {"""

new_start = """// Export for Vercel
export default app;

async function startServer() {
  // If running in Vercel, do not start the server manually
  if (process.env.VERCEL) {
    return;
  }
  
  if (process.env.NODE_ENV !== 'production') {"""

content = content.replace(old_start, new_start)

with open('server.ts', 'w') as f:
    f.write(content)

