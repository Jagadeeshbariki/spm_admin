import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# We want to find the section starting with:
# {plot.activityPhotos && plot.activityPhotos.length > 0 && (
# and ending at:
#                                       </div>
#                                     );
#                                   })}

# Let's find the index of {plot.activityPhotos && plot.activityPhotos.length > 0 && (
start_idx = content.find('{plot.activityPhotos && plot.activityPhotos.length > 0 && (')

# And the index of the final closing of the map function
end_idx = content.find('                                      </div>\n                                    );\n                                  })}')

if start_idx != -1 and end_idx != -1:
    print(f"Found block from {start_idx} to {end_idx}")
else:
    print("Block not found!")
