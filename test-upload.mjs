import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch'; // if available

async function run() {
  const fileContent = "dummy pdf content";
  fs.writeFileSync("dummy.pdf", fileContent);
  
  const formData = new FormData();
  formData.append("tender", fs.createReadStream("dummy.pdf"));
  formData.append("businessProfile", "test profile");
  
  try {
    const res = await fetch("http://localhost:3000/api/analyze", {
      method: "POST",
      body: formData
    });
    
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get("content-type"));
    const text = await res.text();
    console.log("Response starts with:", text.substring(0, 100));
  } catch(e) {
    console.error("Fetch error:", e);
  }
}
run();
