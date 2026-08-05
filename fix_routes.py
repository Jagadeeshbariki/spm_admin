import re

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace('app.get("/api/odk/data",', 'app.get(["/api/odk/data", "/api/odk/data/"],')
content = content.replace("app.get('/api/odk/image',", "app.get(['/api/odk/image', '/api/odk/image/'],")
content = content.replace("app.get('/api/sheets/:sheetName',", "app.get(['/api/sheets/:sheetName', '/api/sheets/:sheetName/'],")
content = content.replace("app.post('/api/upload',", "app.post(['/api/upload', '/api/upload/'],")

with open('server.ts', 'w') as f:
    f.write(content)

