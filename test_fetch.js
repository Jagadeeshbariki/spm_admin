async function run() {
  const fileId = '1InETNLa6SvI8k6U0E8MqEXT1lJhdZlKq';
  try {
    const res = await fetch(`http://localhost:3000/api/drive/file/${encodeURIComponent(fileId)}`);
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text.substring(0, 500));
  } catch(e) {
    console.error(e);
  }
}
run();
