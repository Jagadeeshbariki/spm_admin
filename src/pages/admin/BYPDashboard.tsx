import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Search, Loader2, Users, Bird, IndianRupee, Activity, BarChart3, PieChart as PieChartIcon, LayoutDashboard, Map, Syringe, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList , ScatterChart, Scatter, ZAxis } from 'recharts';
import { cn } from '../../lib/utils';
import { ExpandableChartBox } from '../../components/ExpandableChartBox';
import { flatten } from 'flat';

const TABS = [
  { id: 'overview', name: '1. Executive Overview', icon: LayoutDashboard },
  { id: 'coverage', name: '2. Farmer & Geographic Coverage', icon: Map },
  { id: 'health', name: '3. Services & Bird Health', icon: Syringe },
  { id: 'income', name: '4. Production & Income', icon: TrendingUp },
  { id: 'population', name: '5. Bird Population & Production', icon: Bird },
  { id: 'data-quality', name: '6. Data Quality & MIS', icon: Activity },
];

export default function BYPDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('overview');

  // Filters
  const [selectedBlock, setSelectedBlock] = useState<string[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string[]>([]);
  const [selectedGp, setSelectedGp] = useState<string[]>([]);
  const [selectedVillage, setSelectedVillage] = useState<string[]>([]);
  const [selectedFarmerType, setSelectedFarmerType] = useState<string[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string[]>([]); // Using unique dates for simplicity

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/odk/data?formId=2026-08-04%2000%3A00%3A00');
        if (!res.ok) {
          throw new Error(`Failed to fetch data (${res.status})`);
        }
        const text = await res.text();
        if (text.trim().startsWith('<')) {
          throw new Error('API returned HTML instead of JSON');
        }
        const json = JSON.parse(text);
        
        setData(json.value || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute Filter Options
  const filterOptions = useMemo(() => {
    const blocks = new Set<string>();
    const clusters = new Set<string>();
    const gps = new Set<string>();
    const villages = new Set<string>();
    const farmerTypes = new Set<string>();
    const quarters = new Set<string>();
    const dates = new Set<string>();
    const serviceTypes = new Set<string>();
    const months = new Set<string>();

    data.forEach(item => {
      const b = String(item.location_info?.block || 'Unknown').trim();
      const c = String(item.location_info?.cluster || 'Unknown').trim();
      const g = String(item.location_info?.gp || 'Unknown').trim();
      const v = String(item.location_info?.village || 'Unknown').trim();
      const ft = String(item.table_list_df?.byp_farmer_type || 'Unknown').trim();
      const q = String(item.Quarter || 'Unknown').trim();
      const d = String(item.survey_date || 'Unknown').trim();
      
      if (b && b !== 'undefined' && b !== '-') blocks.add(b);
      if (c && c !== 'undefined' && c !== '-') clusters.add(c);
      if (g && g !== 'undefined' && g !== '-') gps.add(g);
      if (v && v !== 'undefined' && v !== '-') villages.add(v);
      if (ft && ft !== 'undefined' && ft !== '-') farmerTypes.add(ft);
      if (q && q !== 'undefined' && q !== '-' && q !== 'null') quarters.add(q);
      if (d && d !== 'undefined' && d !== '-' && d !== 'null') dates.add(d);
      
      const stRaw = String(item.service_info?.byp_service_type || '');
      stRaw.split(' ').map(s => s.trim()).filter(Boolean).forEach(s => serviceTypes.add(s));
      
      const m = String(item.survey_date || '').substring(0, 7);
      if (m && m !== 'undefin' && m !== 'null' && m !== 'Unknown') months.add(m);
    });

    return {
      blocks: Array.from(blocks).sort(),
      clusters: Array.from(clusters).sort(),
      gps: Array.from(gps).sort(),
      villages: Array.from(villages).sort(),
      farmerTypes: Array.from(farmerTypes).sort(),
      quarters: Array.from(quarters).sort(),
      dates: Array.from(dates).sort(),
      serviceTypes: Array.from(serviceTypes).sort(),
      months: Array.from(months).sort()
    };
  }, [data]);

  // Apply Filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const b = String(item.location_info?.block || 'Unknown').trim();
      const c = String(item.location_info?.cluster || 'Unknown').trim();
      const g = String(item.location_info?.gp || 'Unknown').trim();
      const v = String(item.location_info?.village || 'Unknown').trim();
      const ft = String(item.table_list_df?.byp_farmer_type || 'Unknown').trim();
      const q = String(item.Quarter || 'Unknown').trim();
      const d = String(item.survey_date || 'Unknown').trim();
      const stRaw = String(item.service_info?.byp_service_type || '');
      const stArr = stRaw.split(' ').map(s => s.trim()).filter(Boolean);
      const m = String(item.survey_date || '').substring(0, 7);

      if (selectedBlock.length > 0 && !selectedBlock.includes(b)) return false;
      if (selectedCluster.length > 0 && !selectedCluster.includes(c)) return false;
      if (selectedGp.length > 0 && !selectedGp.includes(g)) return false;
      if (selectedVillage.length > 0 && !selectedVillage.includes(v)) return false;
      if (selectedFarmerType.length > 0 && !selectedFarmerType.includes(ft)) return false;
      if (selectedQuarter.length > 0 && !selectedQuarter.includes(q)) return false;
      if (selectedDate.length > 0 && !selectedDate.includes(d)) return false;
      if (selectedServiceType.length > 0 && !selectedServiceType.some(t => stArr.includes(t))) return false;
      if (selectedMonth.length > 0 && !selectedMonth.includes(m)) return false;

      return true;
    });
  }, [data, selectedBlock, selectedCluster, selectedGp, selectedVillage, selectedFarmerType, selectedQuarter, selectedDate]);

  // Compute Stats for Overview
  const overviewStats = useMemo(() => {
    const uniqueFarmers = new Set<string>();
    const nsFarmers = new Set<string>();
    const bfeFarmers = new Set<string>();
    const uniqueVillages = new Set<string>();
    
    let totalBirds = 0;
    let birdsAdded = 0;
    let birdsSold = 0;
    let totalIncome = 0;
    
    const blockFarmers: Record<string, Set<string>> = {};
    let totalVaccinated = 0;
    let totalDewormed = 0;
    
    const dateBirds: Record<string, number> = {};

    filteredData.forEach(item => {
      // Farmer Identity
      const p = item.personal_info || {};
      const fName = String(p.NS_farmer_name || p.BFE_farmer_name || 'Unknown').trim();
      const ft = String(item.table_list_df?.byp_farmer_type || 'Unknown').trim();
      
      if (fName && fName !== 'null' && fName !== 'undefined') {
        uniqueFarmers.add(fName);
        if (ft === 'NS') nsFarmers.add(fName);
        if (ft === 'BFE') bfeFarmers.add(fName);
        
        const b = String(item.location_info?.block || 'Unknown').trim();
        if (!blockFarmers[b]) blockFarmers[b] = new Set();
        blockFarmers[b].add(fName);
      }
      
      // Villages
      const v = String(item.location_info?.village || 'Unknown').trim();
      if (v && v !== 'null' && v !== 'undefined' && v !== '-') {
        uniqueVillages.add(v);
      }

      // Birds
      const sInfo = item.service_info?.Birds_status || {};
      const birds = parseInt(sInfo.mdc_byp_total_birds || 0, 10);
      const added = parseInt(sInfo.mdc_byp_birds_added_this_month || 0, 10);
      if (!isNaN(birds)) totalBirds += birds;
      if (!isNaN(added)) birdsAdded += added;

      // Income & Sold
      const iInfo = item.Income_info || {};
      const sold = parseInt(iInfo.mdc_byp_birds_sold || 0, 10);
      if (!isNaN(sold)) birdsSold += sold;
      
      const inc1 = parseInt(iInfo.mdc_byp_income_birds_sold || 0, 10);
      const inc2 = parseInt(iInfo.mdc_byp_chicken_sold_income || 0, 10);
      totalIncome += (isNaN(inc1) ? 0 : inc1) + (isNaN(inc2) ? 0 : inc2);
      
      // Services
      const vacn = parseInt(item.service_info?.vacn_info?.mdc_byp_birds_vaccinated || 0, 10);
      if (!isNaN(vacn)) totalVaccinated += vacn;
      const deworm = parseInt(item.service_info?.dewarming_info?.mdc_byp_birds_dewormed || 0, 10);
      if (!isNaN(deworm)) totalDewormed += deworm;
      
      // Trend
      const q = String(item.Quarter || 'Unknown').trim();
      const stRaw = String(item.service_info?.byp_service_type || '');
      const stArr = stRaw.split(' ').map(s => s.trim()).filter(Boolean);
      const m = String(item.survey_date || '').substring(0, 7);
      if (q !== 'Unknown' && q !== 'null') {
        dateBirds[q] = (dateBirds[q] || 0) + (isNaN(birds) ? 0 : birds);
      }
    });

    const farmerBlockData = Object.entries(blockFarmers)
      .map(([name, set]) => ({ name, value: set.size }))
      .sort((a,b) => b.value - a.value);

    const serviceData = [
      { name: 'Vaccinated', value: totalVaccinated },
      { name: 'Dewormed', value: totalDewormed }
    ];
    
    const birdTrendData = Object.entries(dateBirds)
      .map(([date, birds]) => ({ date, birds }))
      .sort((a,b) => a.date.localeCompare(b.date)); // Sort chronologically

    return {
      totalFarmers: uniqueFarmers.size,
      nsFarmers: nsFarmers.size,
      bfeFarmers: bfeFarmers.size,
      villagesCovered: uniqueVillages.size,
      totalBirds,
      birdsAdded,
      birdsSold,
      totalIncome,
      farmerBlockData,
      serviceData,
      birdTrendData
    };
  }, [filteredData]);


  // Compute Stats for Farmer & Geographic Coverage (Page 2)
  const coverageStats = useMemo(() => {
    const blockFarmers: Record<string, Set<string>> = {};
    const clusterFarmers: Record<string, Set<string>> = {};
    const villageFarmers: Record<string, Set<string>> = {};
    const nsBfeCount = { NS: 0, BFE: 0 };
    
    // For the table: Group by Block-Cluster-GP-Village
    const locationTable: Record<string, { block: string, cluster: string, gp: string, village: string, ns: number, bfe: number, total: number, _farmers: Set<string> }> = {};

    const countedFarmers = new Set<string>();

    filteredData.forEach(item => {
      const p = item.personal_info || {};
      const fName = String(p.NS_farmer_name || p.BFE_farmer_name || 'Unknown').trim();
      const ft = String(item.table_list_df?.byp_farmer_type || 'Unknown').trim();
      
      const b = String(item.location_info?.block || 'Unknown').trim();
      const c = String(item.location_info?.cluster || 'Unknown').trim();
      const g = String(item.location_info?.gp || 'Unknown').trim();
      const v = String(item.location_info?.village || 'Unknown').trim();

      if (fName && fName !== 'null' && fName !== 'undefined') {
        if (!blockFarmers[b]) blockFarmers[b] = new Set();
        blockFarmers[b].add(fName);

        if (!clusterFarmers[c]) clusterFarmers[c] = new Set();
        clusterFarmers[c].add(fName);

        if (!villageFarmers[v]) villageFarmers[v] = new Set();
        villageFarmers[v].add(fName);

        if (!countedFarmers.has(fName)) {
           if (ft === 'NS') nsBfeCount.NS++;
           if (ft === 'BFE') nsBfeCount.BFE++;
           countedFarmers.add(fName);
        }

        const locKey = `${b}-${c}-${g}-${v}`;
        if (!locationTable[locKey]) {
          locationTable[locKey] = { block: b, cluster: c, gp: g, village: v, ns: 0, bfe: 0, total: 0, _farmers: new Set() };
        }
        if (!locationTable[locKey]._farmers.has(fName)) {
          locationTable[locKey]._farmers.add(fName);
          locationTable[locKey].total++;
          if (ft === 'NS') locationTable[locKey].ns++;
          if (ft === 'BFE') locationTable[locKey].bfe++;
        }
      }
    });

    const blockData = Object.entries(blockFarmers).map(([name, set]) => ({ name, value: set.size })).sort((a,b) => b.value - a.value);
    const clusterData = Object.entries(clusterFarmers).map(([name, set]) => ({ name, value: set.size })).sort((a,b) => b.value - a.value);
    const villageData = Object.entries(villageFarmers).map(([name, set]) => ({ name, value: set.size })).sort((a,b) => b.value - a.value).slice(0, 20); // Top 20

    const nsBfeData = [
      { name: 'NS', value: nsBfeCount.NS },
      { name: 'BFE', value: nsBfeCount.BFE }
    ].filter(d => d.value > 0);

    const tableData = Object.values(locationTable).sort((a, b) => a.block.localeCompare(b.block) || a.cluster.localeCompare(b.cluster) || a.gp.localeCompare(b.gp) || a.village.localeCompare(b.village));

    return {
      blockData,
      clusterData,
      villageData,
      nsBfeData,
      tableData
    };
  }, [filteredData]);



  // Compute Stats for Health & Services (Page 3)
  const healthStats = useMemo(() => {
    const farmersServiced = new Set<string>();
    let birdsVaccinated = 0;
    let birdsDewormed = 0;
    let vaccinationEvents = 0;
    let dewormingEvents = 0;
    let healthExpenditure = 0;

    const vacMonths: Record<string, number> = {};
    const dewormMonths: Record<string, number> = {};
    const vacNames: Record<string, number> = {};
    const blockServices: Record<string, { Vaccinated: number, Dewormed: number }> = {};
    const tableData: any[] = [];

    filteredData.forEach(item => {
      const sInfo = item.service_info || {};
      const p = item.personal_info || {};
      const fName = String(p.NS_farmer_name || p.BFE_farmer_name || 'Unknown').trim();
      const b = String(item.location_info?.block || 'Unknown').trim();
      const c = String(item.location_info?.cluster || 'Unknown').trim();
      const v = String(item.location_info?.village || 'Unknown').trim();

      const exp = parseInt(sInfo.Birds_status?.mdc_byp_health_expense || 0, 10);
      if (!isNaN(exp)) healthExpenditure += exp;

      const vac = parseInt(sInfo.vacn_info?.mdc_byp_birds_vaccinated || 0, 10);
      const vacDate = sInfo.vacn_info?.date_vaccination;
      const vacName = String(sInfo.vacn_info?.mdc_byp_vaccine_name || sInfo.vacn_info?.other_vaccine_names || 'Unknown').trim();
      
      const deworm = parseInt(sInfo.dewarming_info?.mdc_byp_birds_dewormed || 0, 10);
      const dewormDate = sInfo.dewarming_info?.date_deworming;
      const dewormName = String(sInfo.dewarming_info?.mdc_byp_birds_deworm_name || sInfo.dewarming_info?.other_dewarming_names || 'Unknown').trim();

      if (!blockServices[b]) blockServices[b] = { Vaccinated: 0, Dewormed: 0 };

      let gotService = false;

      if (!isNaN(vac) && vac > 0) {
        birdsVaccinated += vac;
        vaccinationEvents++;
        gotService = true;
        
        const vm = vacDate && vacDate !== 'null' ? String(vacDate).trim() : 'Unknown';
        if (vm && vm !== 'undefin' && vm !== 'null') {
          vacMonths[vm] = (vacMonths[vm] || 0) + vac;
        }
        
        if (vacName && vacName !== 'null') vacNames[vacName] = (vacNames[vacName] || 0) + vac;
        
        blockServices[b].Vaccinated += vac;

        tableData.push({
          date: vacDate || item.survey_date,
          block: b,
          cluster: c,
          village: v,
          farmer: fName,
          serviceType: 'Vaccination',
          birdsCovered: vac,
          serviceName: vacName
        });
      }

      if (!isNaN(deworm) && deworm > 0) {
        birdsDewormed += deworm;
        dewormingEvents++;
        gotService = true;

        const dm = dewormDate && dewormDate !== 'null' ? String(dewormDate).trim() : 'Unknown';
        if (dm && dm !== 'undefin' && dm !== 'null') {
          dewormMonths[dm] = (dewormMonths[dm] || 0) + deworm;
        }

        blockServices[b].Dewormed += deworm;

        tableData.push({
          date: dewormDate || item.survey_date,
          block: b,
          cluster: c,
          village: v,
          farmer: fName,
          serviceType: 'Deworming',
          birdsCovered: deworm,
          serviceName: dewormName
        });
      }

      if (gotService && fName && fName !== 'null' && fName !== 'undefined') {
        farmersServiced.add(fName);
      }
    });

    return {
      farmersServiced: farmersServiced.size,
      birdsVaccinated,
      birdsDewormed,
      vaccinationEvents,
      dewormingEvents,
      healthExpenditure,
      vacVsDewormData: [
        { name: 'Vaccinated', value: birdsVaccinated },
        { name: 'Dewormed', value: birdsDewormed }
      ].filter(d => d.value > 0),
      monthlyVaccination: Object.entries(vacMonths).map(([date, birds]) => ({ date, birds })).sort((a,b) => a.date.localeCompare(b.date)),
      monthlyDeworming: Object.entries(dewormMonths).map(([date, birds]) => ({ date, birds })).sort((a,b) => a.date.localeCompare(b.date)),
      vaccineUsage: Object.entries(vacNames).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
      serviceByBlock: Object.entries(blockServices).map(([name, data]) => ({ name, ...data })).sort((a,b) => (b.Vaccinated + b.Dewormed) - (a.Vaccinated + a.Dewormed)),
      tableData: tableData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  }, [filteredData]);


  // Compute Stats for Production & Income (Page 4)
  const incomeStats = useMemo(() => {
    let totalBirdSaleIncome = 0;
    let totalMeatSaleIncome = 0;
    let totalBirdsSold = 0;
    let totalMeatSoldKG = 0;
    let totalOwnConsumptionValue = 0;
    let totalEggConsumption = 0;
    const farmersWithIncome = new Set<string>();

    const monthlyIncome: Record<string, { birdIncome: number, meatIncome: number, totalIncome: number }> = {};
    const blockIncome: Record<string, { birdIncome: number, meatIncome: number, totalIncome: number, uniqueFarmers: Set<string> }> = {};
    
    const scatterData: any[] = [];
    const tableData: any[] = [];

    filteredData.forEach(item => {
      const p = item.personal_info || {};
      const fName = String(p.NS_farmer_name || p.BFE_farmer_name || 'Unknown').trim();
      const b = String(item.location_info?.block || 'Unknown').trim();
      const v = String(item.location_info?.village || 'Unknown').trim();
      
      const iInfo = item.Income_info || {};
      const birdsSold = parseInt(iInfo.mdc_byp_birds_sold || 0, 10) || 0;
      const birdIncome = parseInt(iInfo.mdc_byp_income_birds_sold || 0, 10) || 0;
      const meatKgs = parseInt(iInfo.mdc_byp_chicken_sold_kgs || 0, 10) || 0;
      const meatIncome = parseInt(iInfo.mdc_byp_chicken_sold_income || 0, 10) || 0;
      const ownConsumpVal = parseInt(iInfo.mdc_byp_birds_own_consumption_value_rs || 0, 10) || 0;
      const eggConsump = parseInt(iInfo.mdc_byp_eggs_own_consumption || 0, 10) || 0;
      
      const totalInc = birdIncome + meatIncome;

      if (totalInc > 0) {
        if (fName && fName !== 'null' && fName !== 'undefined') {
          farmersWithIncome.add(fName);
        }
      }

      totalBirdSaleIncome += birdIncome;
      totalMeatSaleIncome += meatIncome;
      totalBirdsSold += birdsSold;
      totalMeatSoldKG += meatKgs;
      totalOwnConsumptionValue += ownConsumpVal;
      totalEggConsumption += eggConsump;

      // Time series
      const m = String(item.Quarter || 'Unknown').trim();
      if (m && m !== 'undefin' && m !== 'null' && m !== 'Unknown') {
        if (!monthlyIncome[m]) monthlyIncome[m] = { birdIncome: 0, meatIncome: 0, totalIncome: 0 };
        monthlyIncome[m].birdIncome += birdIncome;
        monthlyIncome[m].meatIncome += meatIncome;
        monthlyIncome[m].totalIncome += totalInc;
      }

      // Block-level
      if (!blockIncome[b]) blockIncome[b] = { birdIncome: 0, meatIncome: 0, totalIncome: 0, uniqueFarmers: new Set() };
      blockIncome[b].birdIncome += birdIncome;
      blockIncome[b].meatIncome += meatIncome;
      blockIncome[b].totalIncome += totalInc;
      if (totalInc > 0 && fName && fName !== 'null' && fName !== 'undefined') {
        blockIncome[b].uniqueFarmers.add(fName);
      }

      // Scatter data (only if there are birds sold)
      if (birdsSold > 0) {
        scatterData.push({
          birdsSold,
          birdIncome,
          farmer: fName
        });
      }

      // Table data
      if (totalInc > 0 || ownConsumpVal > 0) {
        tableData.push({
          block: b,
          village: v,
          farmer: fName,
          birdsSold,
          birdIncome,
          meatKgs,
          meatIncome,
          totalIncome: totalInc,
          ownConsumpVal
        });
      }
    });

    const totalBYPIncome = totalBirdSaleIncome + totalMeatSaleIncome;
    const avgIncome = farmersWithIncome.size > 0 ? totalBYPIncome / farmersWithIncome.size : 0;

    const monthlyTrendData = Object.entries(monthlyIncome).map(([date, data]) => ({ date, ...data })).sort((a,b) => a.date.localeCompare(b.date));
    
    const blockIncomeData = Object.entries(blockIncome)
      .map(([name, data]) => ({ 
        name, 
        birdIncome: data.birdIncome, 
        meatIncome: data.meatIncome,
        avgIncome: data.uniqueFarmers.size > 0 ? (data.totalIncome / data.uniqueFarmers.size) : 0
      }))
      .sort((a,b) => (b.birdIncome + b.meatIncome) - (a.birdIncome + a.meatIncome));

    return {
      totalBirdSaleIncome,
      totalMeatSaleIncome,
      totalBYPIncome,
      avgIncome,
      totalBirdsSold,
      totalMeatSoldKG,
      totalOwnConsumptionValue,
      totalEggConsumption,
      monthlyTrendData,
      blockIncomeData,
      scatterData,
      tableData: tableData.sort((a,b) => b.totalIncome - a.totalIncome)
    };
  }, [filteredData]);


  // Compute Stats for Bird Population & Production (Page 5)
  const populationStats = useMemo(() => {
    let totalBirds = 0;
    let totalHens = 0;
    let totalCocks = 0;
    let totalGrowers = 0;
    let totalChicks = 0;
    let totalBirdsAdded = 0;
    let totalBirdsSold = 0;
    let totalMeatSoldKG = 0;

    const blockPop: Record<string, { hens: number, cocks: number, growers: number, chicks: number, total: number }> = {};
    const quarterlyTrend: Record<string, { added: number, sold: number, meat: number }> = {};
    const tableData: any[] = [];

    filteredData.forEach(item => {
      const p = item.personal_info || {};
      const fName = String(p.NS_farmer_name || p.BFE_farmer_name || 'Unknown').trim();
      const b = String(item.location_info?.block || 'Unknown').trim();
      const c = String(item.location_info?.cluster || 'Unknown').trim();
      const v = String(item.location_info?.village || 'Unknown').trim();
      
      const sInfo = item.service_info?.Birds_status || {};
      const hens = parseInt(sInfo.mdc_byp_adult_hens || 0, 10) || 0;
      const cocks = parseInt(sInfo.mdc_byp_adult_cocks || 0, 10) || 0;
      const growers = parseInt(sInfo.mdc_byp_growers || 0, 10) || 0;
      const chicks = parseInt(sInfo.mdc_byp_chicks || 0, 10) || 0;
      const birds = parseInt(sInfo.mdc_byp_total_birds || 0, 10) || (hens + cocks + growers + chicks);
      const added = parseInt(sInfo.mdc_byp_birds_added_this_month || 0, 10) || 0;

      const iInfo = item.Income_info || {};
      const sold = parseInt(iInfo.mdc_byp_birds_sold || 0, 10) || 0;
      const meatKgs = parseInt(iInfo.mdc_byp_chicken_sold_kgs || 0, 10) || 0;

      totalBirds += birds;
      totalHens += hens;
      totalCocks += cocks;
      totalGrowers += growers;
      totalChicks += chicks;
      totalBirdsAdded += added;
      totalBirdsSold += sold;
      totalMeatSoldKG += meatKgs;

      if (!blockPop[b]) {
        blockPop[b] = { hens: 0, cocks: 0, growers: 0, chicks: 0, total: 0 };
      }
      blockPop[b].hens += hens;
      blockPop[b].cocks += cocks;
      blockPop[b].growers += growers;
      blockPop[b].chicks += chicks;
      blockPop[b].total += birds;

      const q = String(item.Quarter || 'Unknown').trim();
      if (q && q !== 'undefined' && q !== 'null' && q !== 'Unknown') {
        if (!quarterlyTrend[q]) quarterlyTrend[q] = { added: 0, sold: 0, meat: 0 };
        quarterlyTrend[q].added += added;
        quarterlyTrend[q].sold += sold;
        quarterlyTrend[q].meat += meatKgs;
      }

      if (birds > 0 || added > 0 || sold > 0 || meatKgs > 0) {
        tableData.push({
          block: b,
          cluster: c,
          village: v,
          farmer: fName,
          hens, cocks, growers, chicks,
          totalBirds: birds,
          birdsAdded: added,
          birdsSold: sold,
          meatKgs
        });
      }
    });

    const blockCompositionData = Object.entries(blockPop)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a,b) => b.total - a.total);

    const quarterlyTrendData = Object.entries(quarterlyTrend)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a,b) => a.date.localeCompare(b.date));

    return {
      totalBirds, totalHens, totalCocks, totalGrowers, totalChicks,
      totalBirdsAdded, totalBirdsSold, totalMeatSoldKG,
      blockCompositionData,
      quarterlyTrendData,
      tableData: tableData.sort((a,b) => b.totalBirds - a.totalBirds)
    };
  }, [filteredData]);


  // Compute Stats for Data Quality & MIS (Page 6)
  const misStats = useMemo(() => {
    let totalSubmissions = filteredData.length;
    let missingRecords = 0;
    let duplicates = 0;

    const monthlySubs: Record<string, number> = {};
    const blockSubs: Record<string, number> = {};
    const submitterSubs: Record<string, number> = {};
    const completenessCounts = {
      farmer: 0,
      village: 0,
      farmerType: 0,
      vacDate: 0,
      birdsVac: 0,
      income: 0,
      mortality: 0
    };

    const farmerDates = new Set<string>();
    const uniqueVillages = new Set<string>();
    const uniqueFarmers = new Set<string>();
    
    const villageStats: Record<string, any> = {};
    const blockReporting: Record<string, { registered: Set<string>, reporting: Set<string> }> = {};

    let maxQuarter = '';
    filteredData.forEach(item => {
       const q = String(item.Quarter || '').trim();
       if (q && q !== 'undefin' && q !== 'null' && q !== 'Unknown' && q > maxQuarter) maxQuarter = q;
    });
    let subsThisQuarter = 0;

    filteredData.forEach(item => {
      const d = String(item.survey_date || 'Unknown').trim();
      const m = String(item.Quarter || 'Unknown').trim();
      
      const p = item.personal_info || {};
      const fName = String(p.NS_farmer_name || p.BFE_farmer_name || '').trim();
      const b = String(item.location_info?.block || 'Unknown').trim();
      const c = String(item.location_info?.cluster || 'Unknown').trim();
      const v = String(item.location_info?.village || 'Unknown').trim();
      const fType = String(item.table_list_df?.byp_farmer_type || '').trim();

      const sInfo = item.service_info || {};
      const vacDate = sInfo.vacn_info?.date_vaccination || '';
      const birdsVac = sInfo.vacn_info?.mdc_byp_birds_vaccinated || '';
      
      const iInfo = item.Income_info || {};
      const income = iInfo.mdc_byp_income_birds_sold || iInfo.mdc_byp_chicken_sold_income || '';

      const mInfo = item.Mortality_info || {};
      const mortality = mInfo.mdc_byp_total_birds_died || '';

      if (m === maxQuarter) subsThisQuarter++;
      if (m && m !== 'undefin' && m !== 'null' && m !== 'Unknown') {
         monthlySubs[m] = (monthlySubs[m] || 0) + 1;
      }

      if (b && b !== 'Unknown') {
         blockSubs[b] = (blockSubs[b] || 0) + 1;
      }

      const submitterName = String(item.__system?.submitterName || item.data_submitter || 'Unknown').trim();
      if (submitterName) {
         submitterSubs[submitterName] = (submitterSubs[submitterName] || 0) + 1;
      }

      if (v && v !== 'Unknown') uniqueVillages.add(v);
      if (fName && fName !== 'null') uniqueFarmers.add(fName);

      // Duplicates
      const fdKey = `${fName}-${d}`;
      if (farmerDates.has(fdKey)) duplicates++;
      else farmerDates.add(fdKey);

      // Missing
      let isMissing = false;
      if (!fName || fName === 'null' || !v || v === 'Unknown') isMissing = true;
      if (isMissing) missingRecords++;

      // Completeness
      if (fName && fName !== 'null') completenessCounts.farmer++;
      if (v && v !== 'Unknown') completenessCounts.village++;
      if (fType && fType !== 'null' && fType !== 'undefined') completenessCounts.farmerType++;
      if (vacDate && vacDate !== 'null') completenessCounts.vacDate++;
      if (birdsVac && birdsVac !== 'null') completenessCounts.birdsVac++;
      if (income && income !== 'null') completenessCounts.income++;
      if (mortality && mortality !== 'null') completenessCounts.mortality++;

      // Village level for table
      const vKey = `${b}|${c}|${v}`;
      if (!villageStats[vKey]) {
        villageStats[vKey] = {
          block: b, cluster: c, village: v,
          farmers: new Set(),
          reportingFarmers: new Set(),
          lastSub: d,
          fieldsFilled: 0,
          totalFields: 0
        };
      }
      if (fName && fName !== 'null') {
        villageStats[vKey].farmers.add(fName);
        if (income || birdsVac || mortality || (sInfo.Birds_status?.mdc_byp_total_birds)) {
           villageStats[vKey].reportingFarmers.add(fName);
        }
      }
      if (d > villageStats[vKey].lastSub) villageStats[vKey].lastSub = d;
      
      let rowFilled = 0;
      if (fName && fName !== 'null') rowFilled++;
      if (v && v !== 'Unknown') rowFilled++;
      if (fType && fType !== 'null') rowFilled++;
      if (vacDate && vacDate !== 'null') rowFilled++;
      if (birdsVac && birdsVac !== 'null') rowFilled++;
      if (income && income !== 'null') rowFilled++;
      if (mortality && mortality !== 'null') rowFilled++;
      
      villageStats[vKey].fieldsFilled += rowFilled;
      villageStats[vKey].totalFields += 7;

      // Block reporting status
      if (!blockReporting[b]) blockReporting[b] = { registered: new Set(), reporting: new Set() };
      if (fName && fName !== 'null') {
        blockReporting[b].registered.add(fName);
        if (income || birdsVac || mortality || (sInfo.Birds_status?.mdc_byp_total_birds)) {
           blockReporting[b].reporting.add(fName);
        }
      }
    });

    const total = totalSubmissions || 1; // Prevent div by zero
    const completenessData = [
      { name: 'Farmer Name', value: Math.round((completenessCounts.farmer / total) * 100) },
      { name: 'Village', value: Math.round((completenessCounts.village / total) * 100) },
      { name: 'Farmer Type', value: Math.round((completenessCounts.farmerType / total) * 100) },
      { name: 'Vaccination Date', value: Math.round((completenessCounts.vacDate / total) * 100) },
      { name: 'Birds Vaccinated', value: Math.round((completenessCounts.birdsVac / total) * 100) },
      { name: 'Income', value: Math.round((completenessCounts.income / total) * 100) },
      { name: 'Mortality', value: Math.round((completenessCounts.mortality / total) * 100) },
    ];

    const monthlyData = Object.entries(monthlySubs).map(([date, count]) => ({ date, count })).sort((a,b) => a.date.localeCompare(b.date));
    const blockData = Object.entries(blockSubs).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    const submitterData = Object.entries(submitterSubs).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    
    const reportingData = Object.entries(blockReporting).map(([name, data]) => {
      const reg = data.registered.size;
      const rep = data.reporting.size;
      return {
        name,
        reporting: rep,
        nonReporting: reg - rep
      };
    }).sort((a,b) => (b.reporting + b.nonReporting) - (a.reporting + a.nonReporting));

    const tableData = Object.values(villageStats).map(v => {
       const reg = v.farmers.size;
       const rep = v.reportingFarmers.size;
       return {
         block: v.block,
         cluster: v.cluster,
         village: v.village,
         registered: reg,
         reporting: rep,
         lastDate: v.lastSub,
         missing: reg - rep,
         completeness: v.totalFields > 0 ? Math.round((v.fieldsFilled / v.totalFields) * 100) : 0
       };
    }).sort((a,b) => b.missing - a.missing);

    return {
      totalSubmissions,
      subsThisQuarter,
      activeVillages: uniqueVillages.size,
      activeFarmers: uniqueFarmers.size,
      missingRecords,
      duplicates,
      completenessData,
      monthlyData,
      blockData,
      submitterData,
      reportingData,
      tableData
    };
  }, [filteredData]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  const toggleFilter = (value: string, setter: any, current: string[]) => {
    if (current.includes(value)) {
      setter(current.filter(item => item !== value));
    } else {
      setter([...current, value]);
    }
  };

  const FilterDropdown = ({ label, options, selected, setter }: { label: string, options: string[], selected: string[], setter: any }) => (
    <div className="relative group">
      <button className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 transition-colors whitespace-nowrap">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        {label} ({selected.length || 'All'})
      </button>
      <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 max-h-64 overflow-y-auto">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
            <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggleFilter(opt, setter, selected)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-slate-700 truncate">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-white rounded-2xl shadow-sm border border-slate-200">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-slate-800">Loading BYP Data</h3>
        <p className="text-slate-500">Fetching records from ODK Central...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Activity className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Failed to load data</h3>
        <p className="text-slate-500 max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Header & Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-4 shrink-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Bird className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">BYP Dashboard</h1>
            <p className="text-xs text-slate-500">Backyard Poultry Performance & Metrics</p>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto custom-scrollbar bg-slate-50">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2",
                activeTab === tab.id 
                  ? "border-blue-500 text-blue-700 bg-blue-50/50" 
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-blue-500" : "text-slate-400")} />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-4 shrink-0 flex flex-wrap items-center gap-2 z-10">
        <FilterDropdown label="Block" options={filterOptions.blocks} selected={selectedBlock} setter={setSelectedBlock} />
        <FilterDropdown label="Cluster" options={filterOptions.clusters} selected={selectedCluster} setter={setSelectedCluster} />
        <FilterDropdown label="GP" options={filterOptions.gps} selected={selectedGp} setter={setSelectedGp} />
        <FilterDropdown label="Village" options={filterOptions.villages} selected={selectedVillage} setter={setSelectedVillage} />
        <FilterDropdown label="Farmer Type" options={filterOptions.farmerTypes} selected={selectedFarmerType} setter={setSelectedFarmerType} />
        <FilterDropdown label="Quarter" options={filterOptions.quarters} selected={selectedQuarter} setter={setSelectedQuarter} />
        <FilterDropdown label="Date" options={filterOptions.dates} selected={selectedDate} setter={setSelectedDate} />
        <FilterDropdown label="Service Type" options={filterOptions.serviceTypes} selected={selectedServiceType} setter={setSelectedServiceType} />
        <FilterDropdown label="Month" options={filterOptions.months} selected={selectedMonth} setter={setSelectedMonth} />
        
        {(selectedBlock.length > 0 || selectedCluster.length > 0 || selectedGp.length > 0 || selectedVillage.length > 0 || selectedFarmerType.length > 0 || selectedQuarter.length > 0 || selectedDate.length > 0 || selectedServiceType.length > 0 || selectedMonth.length > 0) && (
          <button 
            onClick={() => {
              setSelectedBlock([]); setSelectedCluster([]); setSelectedGp([]); setSelectedVillage([]); 
              setSelectedFarmerType([]); setSelectedQuarter([]); setSelectedDate([]); setSelectedServiceType([]); setSelectedMonth([]);
            }}
            className="text-xs text-red-500 hover:text-red-700 font-medium ml-2 px-2"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6 space-y-4">
        
        {activeTab === 'overview' && (
          <>
            {/* Top Row Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Farmers</div>
                <div className="text-2xl font-black text-slate-800">{overviewStats.totalFarmers.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">NS Farmers</div>
                <div className="text-2xl font-black text-blue-600">{overviewStats.nsFarmers.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">BFE Farmers</div>
                <div className="text-2xl font-black text-emerald-600">{overviewStats.bfeFarmers.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Villages Covered</div>
                <div className="text-2xl font-black text-purple-600">{overviewStats.villagesCovered.toLocaleString()}</div>
              </div>
            </div>

            {/* Second Row Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Birds</div>
                <div className="text-2xl font-black text-slate-800">{overviewStats.totalBirds.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Birds Added</div>
                <div className="text-2xl font-black text-emerald-600">+{overviewStats.birdsAdded.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Birds Sold</div>
                <div className="text-2xl font-black text-amber-600">{overviewStats.birdsSold.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Income</div>
                <div className="text-2xl font-black text-slate-800">₹{overviewStats.totalIncome.toLocaleString()}</div>
              </div>
            </div>

            {/* Third Row: Farmer Coverage by Block */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-[350px] flex flex-col">
              <h3 className="font-bold text-slate-800 text-sm mb-4">Farmer Coverage by Block</h3>
              <div className="flex-1 min-h-0">
                {overviewStats.farmerBlockData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <BarChart data={overviewStats.farmerBlockData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                      <XAxis type="number" hide />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                        width={100}
                      />
                      <RechartsTooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} isAnimationActive={false}>
                        <LabelList dataKey="value" position="right" style={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
                )}
              </div>
            </div>

            {/* Fourth Row: Service Coverage & Bird Population Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Service Coverage */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-[300px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Service Coverage (Birds)</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <BarChart data={overviewStats.serviceData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 11 }}
                      />
                      <RechartsTooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} isAnimationActive={false}>
                        <LabelList dataKey="value" position="top" style={{ fontSize: '12px', fill: '#64748b', fontWeight: 'bold' }} />
                        {
                          overviewStats.serviceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f59e0b'} />
                          ))
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bird Population Trend */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-[300px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Bird Population Trend</h3>
                <div className="flex-1 min-h-0">
                  {overviewStats.birdTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <LineChart data={overviewStats.birdTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          dy={10}
                          angle={-45}
                          textAnchor="end"
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 11 }}
                        />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="birds" 
                          stroke="#8b5cf6" 
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6 }}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        
        {activeTab === 'coverage' && (
          <div className="space-y-4">
            {/* Top Row: Block & NS/BFE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-[350px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Farmers by Block</h3>
                <div className="flex-1 min-h-0">
                  {coverageStats.blockData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={coverageStats.blockData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                          width={100}
                        />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} isAnimationActive={false}>
                          <LabelList dataKey="value" position="right" style={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-[350px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-sm mb-4">NS vs BFE</h3>
                <div className="flex-1 min-h-0 relative">
                  {coverageStats.nsBfeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                        <Pie
                          data={coverageStats.nsBfeData}
                          cx="50%"
                          cy="50%"
                          innerRadius="50%"
                          outerRadius="80%"
                          paddingAngle={2}
                          dataKey="value"
                          isAnimationActive={false}
                          labelLine={false}
                        >
                          {coverageStats.nsBfeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'NS' ? '#3b82f6' : '#10b981'} />
                          ))}
                        </Pie>
                        <RechartsTooltip isAnimationActive={false} wrapperStyle={{ pointerEvents: 'none' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Second Row: Cluster & Village */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-[400px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Farmers by Cluster</h3>
                <div className="flex-1 min-h-0">
                  {coverageStats.clusterData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={coverageStats.clusterData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          width={120}
                        />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
                          <LabelList dataKey="value" position="right" style={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-[400px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Farmers by Village (Top 20)</h3>
                <div className="flex-1 min-h-0">
                  {coverageStats.villageData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={coverageStats.villageData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          width={120}
                        />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={12} isAnimationActive={false}>
                          <LabelList dataKey="value" position="right" style={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Third Row: Geographic Details Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-slate-800 text-sm mb-4">Coverage Details</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-slate-500 bg-slate-50 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3 border-b border-slate-200">Block</th>
                      <th className="px-4 py-3 border-b border-slate-200">Cluster</th>
                      <th className="px-4 py-3 border-b border-slate-200">GP</th>
                      <th className="px-4 py-3 border-b border-slate-200">Village</th>
                      <th className="px-4 py-3 border-b border-slate-200 text-center">NS</th>
                      <th className="px-4 py-3 border-b border-slate-200 text-center">BFE</th>
                      <th className="px-4 py-3 border-b border-slate-200 text-center bg-blue-50/50">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {coverageStats.tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2">{row.block}</td>
                        <td className="px-4 py-2">{row.cluster}</td>
                        <td className="px-4 py-2">{row.gp}</td>
                        <td className="px-4 py-2 font-medium">{row.village}</td>
                        <td className="px-4 py-2 text-center text-blue-600 font-medium">{row.ns > 0 ? row.ns : '-'}</td>
                        <td className="px-4 py-2 text-center text-emerald-600 font-medium">{row.bfe > 0 ? row.bfe : '-'}</td>
                        <td className="px-4 py-2 text-center font-bold bg-blue-50/30 text-slate-900">{row.total}</td>
                      </tr>
                    ))}
                    {coverageStats.tableData.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          No geographic coverage data found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'health' && (
          <div className="space-y-3">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Farmers Serviced</div>
                <div className="text-xl font-black text-slate-800">{healthStats.farmersServiced.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Birds Vaccinated</div>
                <div className="text-xl font-black text-emerald-600">{healthStats.birdsVaccinated.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Birds Dewormed</div>
                <div className="text-xl font-black text-blue-600">{healthStats.birdsDewormed.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Vaccination Events</div>
                <div className="text-xl font-black text-slate-800">{healthStats.vaccinationEvents.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Deworming Events</div>
                <div className="text-xl font-black text-slate-800">{healthStats.dewormingEvents.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Health Expense</div>
                <div className="text-xl font-black text-red-600">₹{healthStats.healthExpenditure.toLocaleString()}</div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Vaccination vs Deworming (Column) */}
              <ExpandableChartBox title="Vaccination vs Deworming" className="p-3 h-[280px]">{healthStats.vacVsDewormData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={healthStats.vacVsDewormData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60} isAnimationActive={false}>
                          <LabelList dataKey="value" position="top" style={{ fontSize: '11px', fill: '#64748b', fontWeight: 'bold' }} />
                          {healthStats.vacVsDewormData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'Vaccinated' ? '#10b981' : '#3b82f6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>

              {/* Monthly Vaccination Trend (Line) */}
              <ExpandableChartBox title="Vaccination Trend" className="p-3 h-[280px]">{healthStats.monthlyVaccination.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <LineChart data={healthStats.monthlyVaccination} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="birds" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>

              {/* Monthly Deworming Trend (Line) */}
              <ExpandableChartBox title="Deworming Trend" className="p-3 h-[280px]">{healthStats.monthlyDeworming.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <LineChart data={healthStats.monthlyDeworming} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="birds" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Vaccine-wise Usage (Bar) */}
              <ExpandableChartBox title="Vaccine-wise Usage" className="p-3 h-[280px]">{healthStats.vaccineUsage.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={healthStats.vaccineUsage} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={80} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
                          <LabelList dataKey="value" position="right" style={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>

              {/* Service Delivery by Block (Stacked or Grouped Bar) */}
              <ExpandableChartBox title="Service Delivery by Block" className="p-3 h-[280px]">{healthStats.serviceByBlock.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={healthStats.serviceByBlock} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={80} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={20} wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
                        <Bar dataKey="Vaccinated" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={16} isAnimationActive={false} />
                        <Bar dataKey="Dewormed" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>
            </div>

            {/* Services Detail Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
              <h3 className="font-bold text-slate-800 text-xs mb-3">Health Services Log</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-64 custom-scrollbar">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="text-[10px] text-slate-500 bg-slate-50 uppercase font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 border-b border-slate-200">Date</th>
                      <th className="px-3 py-2 border-b border-slate-200">Block</th>
                      <th className="px-3 py-2 border-b border-slate-200">Cluster</th>
                      <th className="px-3 py-2 border-b border-slate-200">Village</th>
                      <th className="px-3 py-2 border-b border-slate-200">Farmer</th>
                      <th className="px-3 py-2 border-b border-slate-200">Service Type</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Birds Covered</th>
                      <th className="px-3 py-2 border-b border-slate-200">Vaccine / Deworming Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {healthStats.tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2">{row.date}</td>
                        <td className="px-3 py-2">{row.block}</td>
                        <td className="px-3 py-2 text-slate-500">{row.cluster}</td>
                        <td className="px-3 py-2">{row.village}</td>
                        <td className="px-3 py-2 font-medium">{row.farmer}</td>
                        <td className="px-3 py-2">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                            row.serviceType === 'Vaccination' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {row.serviceType}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">{row.birdsCovered}</td>
                        <td className="px-3 py-2 text-slate-500">{row.serviceName}</td>
                      </tr>
                    ))}
                    {healthStats.tableData.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                          No service records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'income' && (
          <div className="space-y-3">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Bird Sale Inc.</div>
                <div className="text-lg font-black text-blue-600">₹{incomeStats.totalBirdSaleIncome.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Meat Sale Inc.</div>
                <div className="text-lg font-black text-rose-600">₹{incomeStats.totalMeatSaleIncome.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 bg-emerald-50 border-emerald-100">
                <div className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Total Income</div>
                <div className="text-xl font-black text-emerald-700">₹{incomeStats.totalBYPIncome.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Avg / Farmer</div>
                <div className="text-lg font-black text-slate-800">₹{Math.round(incomeStats.avgIncome).toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Birds Sold</div>
                <div className="text-lg font-black text-slate-800">{incomeStats.totalBirdsSold.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Meat Sold (KG)</div>
                <div className="text-lg font-black text-slate-800">{incomeStats.totalMeatSoldKG.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Own Consump. (₹)</div>
                <div className="text-lg font-black text-amber-600">₹{incomeStats.totalOwnConsumptionValue.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Egg Consump.</div>
                <div className="text-lg font-black text-amber-600">{incomeStats.totalEggConsumption.toLocaleString()}</div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Income Trend (Line) */}
              <ExpandableChartBox title="Total Income Trend" className="p-3 h-[280px]">{incomeStats.monthlyTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <LineChart data={incomeStats.monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="totalIncome" name="Total Income" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>

              {/* Income Source (Stacked Bar) */}
              <ExpandableChartBox title="Income Source (Bird vs Meat)" className="p-3 h-[280px]">{incomeStats.monthlyTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={incomeStats.monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={20} wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
                        <Bar dataKey="birdIncome" name="Bird Sale Income" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={32} isAnimationActive={false} />
                        <Bar dataKey="meatIncome" name="Meat Sale Income" stackId="a" fill="#e11d48" radius={[4, 4, 0, 0]} barSize={32} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>

              {/* Submissions by Submitter (Bar) */}
              <ExpandableChartBox title="Submissions by Submitter" className="p-3 h-[280px]">{misStats.submitterData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={misStats.submitterData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="count" name="Submissions" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
                          <LabelList dataKey="count" position="top" style={{ fontSize: '10px', fill: '#64748b', fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Income by Block (Stacked Bar) */}
              <ExpandableChartBox title="Income by Block" className="p-3 h-[280px]">{incomeStats.blockIncomeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={incomeStats.blockIncomeData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={80} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={20} wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
                        <Bar dataKey="birdIncome" name="Bird Income" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={16} isAnimationActive={false} />
                        <Bar dataKey="meatIncome" name="Meat Income" stackId="a" fill="#e11d48" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>

              {/* Avg Income per Farmer (Bar) */}
              <ExpandableChartBox title="Avg Income per Farmer" className="p-3 h-[280px]">{incomeStats.blockIncomeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={incomeStats.blockIncomeData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={80} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="avgIncome" name="Avg Income" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
                          <LabelList dataKey="avgIncome" position="right" formatter={(v: number) => `₹${Math.round(v)}`} style={{ fill: '#64748b', fontSize: 9, fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>
              
              {/* Birds Sold vs Income (Scatter) */}
              <ExpandableChartBox title="Birds Sold vs Income" className="p-3 h-[280px]">{incomeStats.scatterData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" dataKey="birdsSold" name="Birds Sold" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <YAxis type="number" dataKey="birdIncome" name="Income (₹)" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <ZAxis dataKey="farmer" name="Farmer" />
                        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Scatter name="Sales" data={incomeStats.scatterData} fill="#8b5cf6" isAnimationActive={false} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>
            </div>

            {/* Income Detail Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
              <h3 className="font-bold text-slate-800 text-xs mb-3">Production & Income Table</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-64 custom-scrollbar">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="text-[10px] text-slate-500 bg-slate-50 uppercase font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 border-b border-slate-200">Block</th>
                      <th className="px-3 py-2 border-b border-slate-200">Village</th>
                      <th className="px-3 py-2 border-b border-slate-200">Farmer</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Birds Sold</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Bird Inc.</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Meat (KG)</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Meat Inc.</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right bg-emerald-50 text-emerald-700">Total Inc.</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Own Cons. (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {incomeStats.tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2">{row.block}</td>
                        <td className="px-3 py-2">{row.village}</td>
                        <td className="px-3 py-2 font-medium">{row.farmer}</td>
                        <td className="px-3 py-2 text-right">{row.birdsSold}</td>
                        <td className="px-3 py-2 text-right text-blue-600 font-medium">₹{row.birdIncome}</td>
                        <td className="px-3 py-2 text-right">{row.meatKgs}</td>
                        <td className="px-3 py-2 text-right text-rose-600 font-medium">₹{row.meatIncome}</td>
                        <td className="px-3 py-2 text-right bg-emerald-50/50 font-bold text-slate-900">₹{row.totalIncome}</td>
                        <td className="px-3 py-2 text-right text-amber-600">₹{row.ownConsumpVal}</td>
                      </tr>
                    ))}
                    {incomeStats.tableData.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                          No income records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'population' && (
          <div className="space-y-3">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 bg-blue-50 border-blue-100">
                <div className="text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Total Birds</div>
                <div className="text-xl font-black text-blue-700">{populationStats.totalBirds.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Hens</div>
                <div className="text-lg font-black text-slate-800">{populationStats.totalHens.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Cocks</div>
                <div className="text-lg font-black text-slate-800">{populationStats.totalCocks.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Growers</div>
                <div className="text-lg font-black text-slate-800">{populationStats.totalGrowers.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Chicks</div>
                <div className="text-lg font-black text-amber-600">{populationStats.totalChicks.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Birds Added</div>
                <div className="text-lg font-black text-emerald-600">+{populationStats.totalBirdsAdded.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Birds Sold</div>
                <div className="text-lg font-black text-rose-600">-{populationStats.totalBirdsSold.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Meat Sold (KG)</div>
                <div className="text-lg font-black text-slate-800">{populationStats.totalMeatSoldKG.toLocaleString()}</div>
              </div>
            </div>

            {/* Charts Row 1: Population Composition & by Block */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Bird Population Composition (Stacked Bar) */}
              <ExpandableChartBox title="Bird Population Composition (by Block)" className="p-3 h-[280px]">{populationStats.blockCompositionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={populationStats.blockCompositionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={20} wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
                        <Bar dataKey="hens" name="Hens" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={32} isAnimationActive={false} />
                        <Bar dataKey="cocks" name="Cocks" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={32} isAnimationActive={false} />
                        <Bar dataKey="growers" name="Growers" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} barSize={32} isAnimationActive={false} />
                        <Bar dataKey="chicks" name="Chicks" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>

              {/* Bird Population by Block (Horizontal Bar) */}
              <ExpandableChartBox title="Total Bird Population by Block" className="p-3 h-[280px]">{populationStats.blockCompositionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={populationStats.blockCompositionData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={80} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="total" name="Total Birds" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
                          <LabelList dataKey="total" position="right" style={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>
            </div>

            {/* Charts Row 2: Trends & Meat */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Birds Added Trend (Line) */}
              <ExpandableChartBox title="Birds Added Trend" className="p-3 h-[280px]">{populationStats.quarterlyTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <LineChart data={populationStats.quarterlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="added" name="Birds Added" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>

              {/* Birds Sold Trend (Line) */}
              <ExpandableChartBox title="Birds Sold Trend" className="p-3 h-[280px]">{populationStats.quarterlyTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <LineChart data={populationStats.quarterlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="sold" name="Birds Sold" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>

              {/* Meat Production (Column) */}
              <ExpandableChartBox title="Meat Production Trend" className="p-3 h-[280px]">{populationStats.quarterlyTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={populationStats.quarterlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="meat" name="Meat Sold (KG)" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
                          <LabelList dataKey="meat" position="top" style={{ fontSize: '10px', fill: '#64748b', fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
              <h3 className="font-bold text-slate-800 text-xs mb-3">Population & Production Log</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-64 custom-scrollbar">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="text-[10px] text-slate-500 bg-slate-50 uppercase font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 border-b border-slate-200">Block</th>
                      <th className="px-3 py-2 border-b border-slate-200">Cluster</th>
                      <th className="px-3 py-2 border-b border-slate-200">Village</th>
                      <th className="px-3 py-2 border-b border-slate-200">Farmer</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Hens</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Cocks</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Growers</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Chicks</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right bg-blue-50 text-blue-700">Total Birds</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right text-emerald-600">Added</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right text-rose-600">Sold</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right text-orange-600">Meat (KG)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {populationStats.tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2">{row.block}</td>
                        <td className="px-3 py-2 text-slate-500">{row.cluster}</td>
                        <td className="px-3 py-2">{row.village}</td>
                        <td className="px-3 py-2 font-medium">{row.farmer}</td>
                        <td className="px-3 py-2 text-right">{row.hens}</td>
                        <td className="px-3 py-2 text-right">{row.cocks}</td>
                        <td className="px-3 py-2 text-right">{row.growers}</td>
                        <td className="px-3 py-2 text-right">{row.chicks}</td>
                        <td className="px-3 py-2 text-right bg-blue-50/50 font-bold text-slate-900">{row.totalBirds}</td>
                        <td className="px-3 py-2 text-right text-emerald-600 font-medium">{row.birdsAdded > 0 ? `+${row.birdsAdded}` : '-'}</td>
                        <td className="px-3 py-2 text-right text-rose-600 font-medium">{row.birdsSold > 0 ? `-${row.birdsSold}` : '-'}</td>
                        <td className="px-3 py-2 text-right text-orange-600 font-medium">{row.meatKgs > 0 ? row.meatKgs : '-'}</td>
                      </tr>
                    ))}
                    {populationStats.tableData.length === 0 && (
                      <tr>
                        <td colSpan={12} className="px-3 py-6 text-center text-slate-400">
                          No population records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        
        {activeTab === 'data-quality' && (
          <div className="space-y-3">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Total Submissions</div>
                <div className="text-xl font-black text-slate-800">{misStats.totalSubmissions.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 bg-emerald-50 border-emerald-100">
                <div className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Subs This Quarter</div>
                <div className="text-xl font-black text-emerald-700">{misStats.subsThisQuarter.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Active Villages</div>
                <div className="text-xl font-black text-slate-800">{misStats.activeVillages.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Active Farmers</div>
                <div className="text-xl font-black text-slate-800">{misStats.activeFarmers.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Missing Data Rec.</div>
                <div className="text-xl font-black text-amber-600">{misStats.missingRecords.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Duplicate Records</div>
                <div className="text-xl font-black text-rose-600">{misStats.duplicates.toLocaleString()}</div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Monthly Submissions (Line) */}
              <ExpandableChartBox title="Quarterly Submissions" className="p-3 h-[280px]">{misStats.monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <LineChart data={misStats.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="count" name="Submissions" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>

              {/* Submissions by Block (Bar) */}
              <ExpandableChartBox title="Submissions by Block" className="p-3 h-[280px]">{misStats.blockData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={misStats.blockData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="count" name="Submissions" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>

              {/* Submissions by Submitter (Bar) */}
              <ExpandableChartBox title="Submissions by Submitter" className="p-3 h-[280px]">{misStats.submitterData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={misStats.submitterData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="count" name="Submissions" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
                          <LabelList dataKey="count" position="top" style={{ fontSize: '10px', fill: '#64748b', fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Data Completeness (Horizontal Bar) */}
              <ExpandableChartBox title="Data Completeness %" className="p-3 h-[280px]"><ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <BarChart data={misStats.completenessData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={90} />
                      <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="value" name="Completion %" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
                        <LabelList dataKey="value" position="right" formatter={(v: number) => `${v}%`} style={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer></ExpandableChartBox>

              {/* Reporting Status (Stacked Bar) */}
              <ExpandableChartBox title="Reporting Status by Block" className="p-3 h-[280px]">{misStats.reportingData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={misStats.reportingData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={20} wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
                        <Bar dataKey="reporting" name="Reporting Farmers" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={40} isAnimationActive={false} />
                        <Bar dataKey="nonReporting" name="Non-reporting Farmers" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}</ExpandableChartBox>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
              <h3 className="font-bold text-slate-800 text-xs mb-3">MIS Monitoring Table</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-64 custom-scrollbar">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="text-[10px] text-slate-500 bg-slate-50 uppercase font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 border-b border-slate-200">Block</th>
                      <th className="px-3 py-2 border-b border-slate-200">Cluster</th>
                      <th className="px-3 py-2 border-b border-slate-200">Village</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Registered</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Reporting</th>
                      <th className="px-3 py-2 border-b border-slate-200">Last Submission Date</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Missing Reports</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Completeness %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {misStats.tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2">{row.block}</td>
                        <td className="px-3 py-2 text-slate-500">{row.cluster}</td>
                        <td className="px-3 py-2">{row.village}</td>
                        <td className="px-3 py-2 text-right">{row.registered}</td>
                        <td className="px-3 py-2 text-right text-emerald-600 font-medium">{row.reporting}</td>
                        <td className="px-3 py-2">{row.lastDate}</td>
                        <td className="px-3 py-2 text-right text-rose-600 font-medium">{row.missing}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={cn("px-2 py-0.5 rounded-full font-bold", row.completeness >= 80 ? "bg-emerald-100 text-emerald-700" : row.completeness >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700")}>
                            {row.completeness}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {misStats.tableData.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                          No MIS records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Placeholders for other tabs */}
        {activeTab !== 'overview' && (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center h-64">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <LayoutDashboard className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">Page Under Construction</h3>
            <p className="text-slate-500">The {TABS.find(t => t.id === activeTab)?.name} page is currently being built.</p>
          </div>
        )}

      </div>
    </div>
  );
}
