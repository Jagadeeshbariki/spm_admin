with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

start_marker = "      {/* Summary Tables */}"
end_marker = "function FilterSelect("

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    injected_code = content[start_idx:end_idx].strip()
    
    # We must remove the trailing `</div>\n  );\n}` from injected code so we can put it back to CropsDashboard
    # The last 3 lines are `    </div>`, `  );`, `}`
    
    # Actually, let's just strip the injected code out, and restore CropsDashboard's ending
    content = content[:start_idx] + "    </div>\n  );\n}\n\n" + content[end_idx:]
    
    # the injected code itself currently contains the `</div> ); }` at the end because of how it was appended
    injected_code = injected_code.replace("    </div>\n  );\n}", "").strip()
    
    # Now let's append it to OverviewTab
    overview_end_marker = "      {/* HDFC Insights */}"
    overview_end_idx = content.find(overview_end_marker)
    if overview_end_idx != -1:
        # We need to find the end of OverviewTab which is after HDFC Insights
        overview_func_end = content.find("  );\n}", overview_end_idx)
        if overview_func_end != -1:
            # We want to insert `injected_code` right before `    </div>\n  );\n}` at the very end of OverviewTab
            insert_point = content.rfind("    </div>", overview_end_idx, overview_func_end + 20)
            if insert_point != -1:
                content = content[:insert_point] + "\n      " + injected_code + "\n\n" + content[insert_point:]
                print("Successfully moved!")
            else:
                print("Could not find insert point")
        else:
            print("Could not find overview func end")
    else:
        print("Could not find overview end marker")
else:
    print("Could not find start or end markers")

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

