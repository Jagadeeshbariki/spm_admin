import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

# Add a block in fetchSheet for BVS_Geo if needed
# But user only reported Polygons_manyam

