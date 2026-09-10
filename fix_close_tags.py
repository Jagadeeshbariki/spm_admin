with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

bad_closing = """                                            )}

                                      </div>
                                    );
                                  })}"""

good_closing = """                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}"""

if bad_closing in content:
    content = content.replace(bad_closing, good_closing)
    with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
        f.write(content)
    print("Fixed closing tags!")
else:
    print("Bad closing not found!")
