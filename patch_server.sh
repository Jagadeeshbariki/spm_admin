#!/bin/bash
awk '
/app.get..\/api\/odk\/image/ {
    print "app.get(\"/api/odk/data\", async (req, res) => {"
    print "  try {"
    print "    const { formId } = req.query;"
    print "    if (!formId || typeof formId !== \"string\") {"
    print "      return res.status(400).json({ error: \"Missing or invalid formId parameter\" });"
    print "    }"
    print "    const token = await getOdkToken();"
    print "    const url = `https://central.wassan.org/v1/projects/3/forms/${encodeURIComponent(formId)}.svc/Submissions?$expand=*`;"
    print "    const response = await fetch(url, {"
    print "      headers: { Authorization: `Bearer ${token}` }"
    print "    });"
    print "    if (!response.ok) {"
    print "      const errText = await response.text();"
    print "      console.error(\"ODK Data Fetch Error:\", response.status, errText);"
    print "      return res.status(response.status).json({ error: \"Failed to fetch data from ODK\", details: errText });"
    print "    }"
    print "    const data = await response.json();"
    print "    res.json(data);"
    print "  } catch (error: any) {"
    print "    console.error(\"Error proxying ODK data:\", error);"
    print "    res.status(500).json({ error: \"Internal server error fetching ODK data\" });"
    print "  }"
    print "});"
    print ""
}
{ print }
' server.ts > server_new.ts
mv server_new.ts server.ts
