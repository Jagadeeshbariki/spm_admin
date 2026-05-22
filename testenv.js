const TEAM_TRAVEL_API_BASE = "https://script.google.com/macros/s/AKfycbw0wfnPTG6Yox1F5emRonB_w3WESZ_b3qegvrf1QPKhCRHJH7yqSGEhNvdlty2pAAW2/exec";

(async () => {
  try {
    const res = await fetch(TEAM_TRAVEL_API_BASE, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ 
        action: "add", 
        sheetName: "team_travel", 
        data: {
          id: "TRV-123",
          'Entry ID': "TRV-123",
          'Staff Name': 'Test Staff',
          'Month': 'January',
          'Project': 'Project A',
          'Travel Amount': 100,
          'Date': '2023-01-01',
          'Financial Year': 'FY23-24'
        } 
      })
    });
    console.log("Status:", res.status);
    console.log("Headers:", res.headers);
    const text = await res.text();
    console.log("Response text:", text.substring(0, 500));
  } catch(e) {
    console.error("Error:", e);
  }
})();
