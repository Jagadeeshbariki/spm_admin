async function run() {
  const [regR, actR] = await Promise.all([
    fetch("http://localhost:3000/api/odk/data?formId=NF-%20Register"),
    fetch("http://localhost:3000/api/odk/data?formId=NF-%20Activities")
  ]);
  const reg = await regR.json();
  const act = await actR.json();

  const regSub = reg.value || [];
  const actSub = act.value || [];

  let matchCount = 0;
  regSub.forEach(sub => {
    const hhId = sub.plot_reg?.farmer_Id || '';
    const farmerName = sub.plot_reg?.farmer_name || '';
    const season = sub.plot_reg?.season || '';
    const sowingDate = sub.plot_reg?.sowing_date || '';

    const matched = actSub.filter(a => {
      const p = a.Primary_details || {};
      const actFarmer = String(p.farmer_name || '').trim().toLowerCase();
      const actSeason = String(p.season || p.data_season || '').trim().toLowerCase();
      const actSowing = String(p.sowing_date || '').trim();

      const f1 = String(hhId).trim().toLowerCase();
      const f2 = String(farmerName).trim().toLowerCase();
      
      const isFarmerMatch = actFarmer && (actFarmer === f1 || actFarmer === f2);
      const isSeasonMatch = actSeason === String(season).trim().toLowerCase();
      const isSowingMatch = actSowing === String(sowingDate).trim();

      return isFarmerMatch && isSeasonMatch && isSowingMatch;
    });

    if (matched.length > 0) {
      matchCount++;
      console.log(`Matched! HHID: ${hhId}, Farmer: ${farmerName} - Activities: ${matched.length}`);
    }
  });

  console.log(`Total matched records: ${matchCount}`);
}
run();
