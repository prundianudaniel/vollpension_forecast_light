#!/usr/bin/env node

/**
 * Script to send deals.csv to the local API endpoint
 * Usage: node send-csv.js [path-to-csv-file]
 */

import fs from "fs";
import path from "path";
import FormData from "form-data";
import fetch from "node-fetch";

const API_URL = "http://localhost:8787/process-csv";
const DEFAULT_CSV_FILE = "deals.csv";

async function sendCSVToAPI(csvFilePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(csvFilePath)) {
      console.error(`❌ CSV file not found: ${csvFilePath}`);
      console.log("💡 Make sure the file exists or provide the correct path");
      return;
    }

    console.log(`📁 Reading CSV file: ${csvFilePath}`);

    // Read the CSV file
    const csvContent = fs.readFileSync(csvFilePath, "utf8");
    console.log(`📊 File size: ${csvContent.length} characters`);

    // Create form data
    const formData = new FormData();
    formData.append("csv", csvContent, {
      filename: path.basename(csvFilePath),
      contentType: "text/csv",
    });

    console.log(`🚀 Sending to API: ${API_URL}`);

    // Send to API
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    console.log("✅ Success! API Response:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(JSON.stringify(result, null, 2));
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Show summary
    if (result.success && result.data) {
      console.log("\n📈 Summary:");
      console.log(`   • Total rows: ${result.data.totalRows}`);
      console.log(`   • Columns: ${result.data.summary.columns}`);
      console.log(`   • Headers: ${result.data.headers.join(", ")}`);
      console.log(`   • Processed at: ${result.data.summary.timestamp}`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.log("\n💡 Make sure the local server is running:");
      console.log("   cd vollpension_forecast_light");
      console.log("   npm start");
    }
  }
}

// Main execution
async function main() {
  const csvFile = process.argv[2] || DEFAULT_CSV_FILE;

  console.log("🎯 Vollpension Forecast CSV Sender");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📄 CSV File: ${csvFile}`);
  console.log(`🌐 API URL: ${API_URL}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await sendCSVToAPI(csvFile);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { sendCSVToAPI };
