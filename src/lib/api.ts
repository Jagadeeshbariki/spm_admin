import Papa from "papaparse";

const API_BASE = "https://script.google.com/macros/s/AKfycbwmJxHEodAZPOUN9qQ-o1Uj9mEmt3OgymdLCzCqUpPYWTaq-brr-PdPfftd5pmpBr8/exec";
const TEAM_TRAVEL_API_BASE = "https://script.google.com/macros/s/AKfycbw0wfnPTG6Yox1F5emRonB_w3WESZ_b3qegvrf1QPKhCRHJH7yqSGEhNvdlty2pAAW2/exec";
const TEAM_TRAVEL_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTX_a8ee-nsKyWSNtH_2QeCdysPGfT-u-JLMtvqcwqy2vxk2zZQ1VJ9O1e5yqv-m7_ItO-5wKKCSaBk/pub?gid=0&single=true&output=csv";

const OFFICE_ADMIN_SPREADSHEET_ID =
  "18Afss-S7VLMhgGluuwm4RanzyRfew61NLa_QzmBxHz4";
const WATER_COLLECTIVE_SPREADSHEET_ID =
  "1n2qE-rdkVefVieM1z0C0Ah_Z04Gg6b7MrRca-LcNrvo";
const MAIL_TRACKER_SPREADSHEET_ID =
  "18cmONE4zcVWsfWJ42vSUUX-LYjt-GEe-sRPfizHbQic"; // Replace with your Application_Mail Tracker Spreadsheet ID

export const ADMIN_FOLDER_ID = "1d_4gLeoJ84zPrUe-vPJDR-f5b4V-ksY3";
export const WATER_COLLECTIVES_FOLDER_ID = "1gga5glk6oNlI5tRDZFMthh4B-sUa0NnG";

const MASTER_SPREADSHEET_ID = "13inc1LrMAjqTVCjDiEaIOwqSO39dUzQwFWbZbpypSrA";

function getSpreadsheetId(sheetName: string) {
  if (sheetName === "water_collectives" || sheetName === "Polygons_manyam") {
    return WATER_COLLECTIVE_SPREADSHEET_ID;
  }
  if (sheetName === "Processing Hubs" || sheetName === "village_assets" || sheetName === "Master") {
    return MASTER_SPREADSHEET_ID;
  }
  if (sheetName === "mail_tracker" || sheetName === "mail_tracker_batches") {
    return MAIL_TRACKER_SPREADSHEET_ID;
  }
  return OFFICE_ADMIN_SPREADSHEET_ID;
}

export async function fetchWithFallback(
  url: string,
  options: RequestInit = {},
) {
  const controller = new AbortController();
  // Increased timeout to 60 seconds for larger GeoJSON files
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error(
        "Loading is taking longer than expected. Please check your internet or retry.",
      );
    }

    console.warn("Direct fetch failed, attempting via proxy...", error);

    // Fallback to a CORS proxy if the browser blocks the direct connection
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const proxyController = new AbortController();
    const proxyTimeoutId = setTimeout(() => proxyController.abort(), 25000); // Slightly longer for proxy

    try {
      const res = await fetch(proxyUrl, {
        ...options,
        signal: proxyController.signal,
      });
      clearTimeout(proxyTimeoutId);
      return res;
    } catch (proxyError: any) {
      clearTimeout(proxyTimeoutId);
      if (proxyError.name === "AbortError") {
        throw new Error("Proxy request timed out.");
      }
      throw proxyError;
    }
  }
}

const PROCESSING_HUBS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTmXCBpa6shu6HG0groD4a5VZwtwpnkrpb8_epyjxauOm_35o0jyWl3IwbxVm7m4unV29ZTu2GkW45-/pub?gid=0&single=true&output=csv";

function getWriteApiBase(sheetName: string) {
  if (sheetName === "team_travel" || sheetName === "Team Travel" || sheetName === "Team_Travel") {
    return TEAM_TRAVEL_API_BASE;
  }
  return API_BASE;
}

const MASTER_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/13inc1LrMAjqTVCjDiEaIOwqSO39dUzQwFWbZbpypSrA/gviz/tq?tqx=out:csv&sheet=Master";

export async function fetchSheet(sheetName: string) {
  try {
    if (sheetName === "village_assets") return [];
    if (sheetName === "Processing Hubs" || sheetName === "Master") {
      // Use the explicit Master sheet URL to avoid Google Apps Script permission issues
      const res = await fetchWithFallback(`${MASTER_SHEET_CSV_URL}&t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to fetch Master CSV");
      const text = await res.text();
      return new Promise<any[]>((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
          complete: (results) => {
            const data = results.data.map((row: any, index: number) => ({
              ...row,
              _rowIndex: index + 2,
            }));
            resolve(data);
          },
          error: (err: any) => reject(err),
        });
      });
    }

    if (sheetName === "team_travel" || sheetName === "Team Travel" || sheetName === "Team_Travel") {
      const res = await fetchWithFallback(`${TEAM_TRAVEL_CSV_URL}&t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to fetch Team Travel CSV");
      const text = await res.text();
      return new Promise<any[]>((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
          complete: (results) => {
            const data = results.data.map((row: any, index: number) => ({
              ...row,
              _rowIndex: index + 2,
            }));
            resolve(data);
          },
          error: (err: any) => reject(err),
        });
      });
    }

    const spreadsheetId = getSpreadsheetId(sheetName);
    const url = `${API_BASE}?sheetName=${encodeURIComponent(sheetName)}&spreadsheetId=${encodeURIComponent(spreadsheetId)}&t=${Date.now()}`;
    const res = await fetchWithFallback(url);
    if (!res.ok) throw new Error(`Failed to fetch ${sheetName}`);

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return []; // Silently fail if it's HTML, to avoid crashing component
    }

    const data = await res.json();
    if (data && data.error) {
      console.warn(`Sheet error for ${sheetName}:`, data.error);
      return [];
    }
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error("Fetch error:", error);
    if (
      error.message === "Failed to fetch" ||
      error.message.includes("NetworkError")
    ) {
      throw new Error(
        'Connection failed. Please ensure the Google Apps Script is deployed with "Who has access: Anyone".',
      );
    }
    throw error;
  }
}

export async function addRow(sheetName: string, data: any) {
  try {
    let targetSheetName = sheetName;
    let payload: any = { action: "add", sheetName, data };
    
    if (sheetName === "team_travel" || sheetName === "Team Travel" || sheetName === "Team_Travel") {
      targetSheetName = "Team_Travel";
      payload = { action: "add", sheetName: targetSheetName, data }; // Omit spreadsheetId, new Apps script doesn't know it or need it
    } else {
      payload.spreadsheetId = getSpreadsheetId(sheetName);
    }
    
    const baseUrl = getWriteApiBase(targetSheetName);
    const res = await fetchWithFallback(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to add row to ${sheetName}`);
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    return result;
  } catch (error: any) {
    if (error.message === "Failed to fetch") {
      throw new Error(
        'Connection failed. Please ensure the Google Apps Script is deployed with "Who has access: Anyone".',
      );
    }
    throw error;
  }
}

export async function updateRow(
  sheetName: string,
  rowIndex: number,
  data: any,
) {
  try {
    let targetSheetName = sheetName;
    let payload: any = { action: "update", sheetName, rowIndex, data };

    if (sheetName === "team_travel" || sheetName === "Team Travel" || sheetName === "Team_Travel") {
      targetSheetName = "Team_Travel";
      payload = { action: "update", sheetName: targetSheetName, rowIndex, data };
    } else {
      payload.spreadsheetId = getSpreadsheetId(sheetName);
    }

    const baseUrl = getWriteApiBase(targetSheetName);
    const res = await fetchWithFallback(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to update row in ${sheetName}`);
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    return result;
  } catch (error: any) {
    if (error.message === "Failed to fetch") {
      throw new Error(
        'Connection failed. Please ensure the Google Apps Script is deployed with "Who has access: Anyone".',
      );
    }
    throw error;
  }
}

export async function deleteRow(sheetName: string, rowIndex: number) {
  try {
    let targetSheetName = sheetName;
    let payload: any = { action: "delete", sheetName, rowIndex };

    if (sheetName === "team_travel" || sheetName === "Team Travel" || sheetName === "Team_Travel") {
      targetSheetName = "Team_Travel";
      payload = { action: "delete", sheetName: targetSheetName, rowIndex };
    } else {
      payload.spreadsheetId = getSpreadsheetId(sheetName);
    }

    const baseUrl = getWriteApiBase(targetSheetName);
    const res = await fetchWithFallback(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to delete row from ${sheetName}`);
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    return result;
  } catch (error: any) {
    if (error.message === "Failed to fetch") {
      throw new Error(
        'Connection failed. Please ensure the Google Apps Script is deployed with "Who has access: Anyone".',
      );
    }
    throw error;
  }
}

export async function fetchFileContent(fileId: string) {
  try {
    const url = `${API_BASE}?action=getFile&fileId=${encodeURIComponent(fileId)}&t=${Date.now()}`;
    const res = await fetchWithFallback(url);
    if (!res.ok) throw new Error("Failed to fetch file");

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(
        "Server returned HTML instead of file data. This often means the Google script or Drive link is unauthorized or incorrect.",
      );
    }

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    return data.content || "";
  } catch (error: any) {
    console.error("Fetch file content error:", error);
    throw error;
  }
}

export async function fetchGeoJson(fileId: string) {
  try {
    const content = await fetchFileContent(fileId);
    if (!content) return null;
    return JSON.parse(content);
  } catch (error: any) {
    console.error(`Error parsing GeoJSON ${fileId}:`, error);
    throw new Error(`Failed to load GeoJSON (${fileId}).`);
  }
}

export async function getSetting(
  category: string,
  key: string,
): Promise<string | null> {
  try {
    const masterData = await fetchSheet("MasterData");
    const filtered = masterData.filter(
      (item) =>
        item.formname === "GIS Configuration" &&
        item["dropdwon catagorty"] === category &&
        item["dropdwon options"] === key,
    );
    const setting = filtered[filtered.length - 1]; // Get the latest upload
    return setting ? setting.value || setting["dropdwon options"] : null;
  } catch (e) {
    return null;
  }
}

async function compressImage(file: File, maxWidth: number = 1920): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (maxWidth * height) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: file.type }));
          } else {
            resolve(file); // Fallback to original if compression fails
          }
        }, file.type, 0.8); // 80% quality
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

export async function uploadFile(
  file: File,
  folderId: string = ADMIN_FOLDER_ID,
): Promise<any> {
  file = await compressImage(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64String = (reader.result as string).split(",")[1];
        const res = await fetchWithFallback(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "upload",
            base64: base64String,
            mimeType: file.type,
            fileName: file.name,
            folderId: folderId,
          }),
        });
        if (!res.ok) {
          const bodyText = await res.text().catch(() => '');
          throw new Error(`Failed to upload file. status: ${res.status}, text: ${bodyText}`);
        }
        const result = await res.json();
        if (result.error) throw new Error(result.error);

        if (result.url && !result.webViewLink) {
          result.webViewLink = result.url;
        }

        resolve(result);
      } catch (error: any) {
        if (error.message === "Failed to fetch") {
          reject(
            new Error(
              'Connection failed. Please ensure the Google Apps Script is deployed with "Who has access: Anyone".',
            ),
          );
        } else {
          reject(error);
        }
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
