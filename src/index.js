/**
 * CSV Processing API for Vollpension Forecast
 * Handles CSV file uploads and processing
 */

import {
  handleCSVProcessing,
  calculateWeeklyLiquidityForecast,
  calculateWeeklyDealStats,
} from "./csvProcessor.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Route handling
    if (url.pathname === "/process-csv-weekly") {
      return await handleWeeklyCSVProcessing(request, env);
    }

    // Monthly Revenue Management Endpoints
    if (url.pathname === "/monthly-revenue") {
      if (request.method === "GET") {
        return await getMonthlyRevenues(env);
      }
      if (request.method === "POST") {
        return await addMonthlyRevenue(request, env);
      }
    }

    if (
      url.pathname.startsWith("/monthly-revenue/") &&
      request.method === "DELETE"
    ) {
      const id = url.pathname.split("/").pop();
      return await deleteMonthlyRevenue(id, env);
    }

    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          message: "Vollpension Forecast API is running",
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (url.pathname === "/process-csv" && request.method === "POST") {
      return handleCSVProcessing(request);
    }

    if (url.pathname === "/" && request.method === "GET") {
      // Serve the static HTML file
      return new Response(
        `<!DOCTYPE html>
<html>
<head>
    <title>Vollpension Forecast - Liquiditätsplanung</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 1000px; 
            margin: 0 auto; 
            padding: 20px; 
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .upload-area { 
            border: 3px dashed #007cba; 
            padding: 40px; 
            text-align: center; 
            margin: 20px 0; 
            border-radius: 8px;
            background: #f8f9ff;
            cursor: pointer;
        }
        .upload-area:hover { 
            border-color: #005a87; 
            background: #f0f2ff;
        }
        button { 
            background: #007cba; 
            color: white; 
            padding: 15px 30px; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-size: 16px;
            margin: 10px 0;
        }
        button:hover { background: #005a87; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        .result { 
            margin-top: 30px; 
            padding: 20px; 
            background: white; 
            border-radius: 8px; 
            border: 1px solid #ddd;
        }
        .chart-container { margin: 20px 0; }
        .summary { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin: 20px 0; 
        }
        .summary-card { 
            background: #f8f9ff; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center; 
            border: 1px solid #e0e0e0;
        }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; font-size: 14px; }
        .summary-card .value { font-size: 1.8em; font-weight: bold; color: #007cba; }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
            background: white;
        }
        th, td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #ddd; 
        }
        th { 
            background: #f8f9ff; 
            color: #007cba; 
            font-weight: 600; 
        }
        tr:hover { background: #f8f9ff; }
        .loading {
            text-align: center;
            padding: 40px;
            color: #007cba;
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007cba;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .error {
            background: #fee;
            color: #c33;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>💰 Vollpension Forecast</h1>
        <p><strong>Liquiditätsplanung basierend auf gewonnenen Deals</strong></p>
        
        <div class="upload-area" onclick="document.getElementById('csvFile').click()">
            <h3>📁 CSV-Datei hochladen</h3>
            <p>Klicken Sie hier oder ziehen Sie eine CSV-Datei hierher</p>
            <input type="file" id="csvFile" accept=".csv" style="display: none;">
        </div>
        
        <button onclick="processCSV()" id="processBtn">🚀 Liquiditätsplanung erstellen</button>
        
        <div id="result" class="result" style="display: none;"></div>
    </div>

    <script>
        let selectedFile = null;
        
        // Drag and drop functionality
        const uploadArea = document.querySelector('.upload-area');
        
        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#005a87';
            uploadArea.style.background = '#f0f2ff';
        });
        
        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#007cba';
            uploadArea.style.background = '#f8f9ff';
        });
        
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.style.borderColor = '#007cba';
            uploadArea.style.background = '#f8f9ff';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                selectedFile = files[0];
                updateUploadArea();
            }
        });
        
        document.getElementById('csvFile').addEventListener('change', function(e) {
            selectedFile = e.target.files[0];
            updateUploadArea();
        });

        function updateUploadArea() {
            if (selectedFile) {
                document.querySelector('.upload-area h3').textContent = '✅ ' + selectedFile.name;
                document.querySelector('.upload-area p').textContent = 'Datei ausgewählt - bereit zur Verarbeitung';
            }
        }

        async function processCSV() {
            if (!selectedFile) {
                alert('Bitte wählen Sie zuerst eine CSV-Datei aus');
                return;
            }

            const processBtn = document.getElementById('processBtn');
            const resultDiv = document.getElementById('result');
            
            // Show loading state
            processBtn.disabled = true;
            processBtn.textContent = '⏳ Verarbeite CSV...';
            
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = \`
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Analysiere Deals und erstelle Liquiditätsplanung...</p>
                </div>
            \`;

            const formData = new FormData();
            formData.append('csv', selectedFile);

            try {
                const response = await fetch('/process-csv', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (result.success && result.data.liquidityForecast) {
                    displayLiquidityResults(result.data);
                } else {
                    resultDiv.innerHTML = '<h3>Processing Result:</h3><pre>' + JSON.stringify(result, null, 2) + '</pre>';
                }
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="error">
                        <h3>❌ Fehler beim Verarbeiten</h3>
                        <p>\${error.message}</p>
                    </div>
                \`;
            } finally {
                processBtn.disabled = false;
                processBtn.textContent = '🚀 Liquiditätsplanung erstellen';
            }
        }

        function displayLiquidityResults(data) {
            const resultDiv = document.getElementById('result');
            
            resultDiv.innerHTML = \`
                <h3>📊 Liquiditätsplanung Ergebnisse</h3>
                
                <div class="summary">
                    <div class="summary-card">
                        <h3>Gewonnene Deals</h3>
                        <div class="value">\${data.wonDeals}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Gesamt Deal-Wert</h3>
                        <div class="value">\${new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR'}).format(data.totalDealValue)}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Prognostizierte Liquidität</h3>
                        <div class="value">\${data.liquidityForecast.summary.formattedFinalBalance}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Prognose-Monate</h3>
                        <div class="value">\${data.liquidityForecast.summary.totalMonths}</div>
                    </div>
                </div>
                
                <div class="chart-container">
                    <h3>📈 Monatliche Liquiditätsplanung</h3>
                    <canvas id="liquidityChart" width="400" height="200"></canvas>
                </div>
                
                <h3>📋 Detaillierte Monatsübersicht</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Monat</th>
                            <th>Monatlicher Betrag</th>
                            <th>Kumulativer Übertrag</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${data.liquidityForecast.monthlyForecast.map(item => \`
                            <tr>
                                <td><strong>\${item.month}</strong></td>
                                <td>\${item.formattedAmount}</td>
                                <td><strong>\${item.formattedCumulativeBalance}</strong></td>
                            </tr>
                        \`).join('')}
                    </tbody>
                </table>
            \`;
            
            // Create chart
            createLiquidityChart(data.liquidityForecast.monthlyForecast);
        }

        function createLiquidityChart(forecastData) {
            const ctx = document.getElementById('liquidityChart').getContext('2d');
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: forecastData.map(item => item.month),
                    datasets: [{
                        label: 'Monatlicher Cash-Flow',
                        data: forecastData.map(item => item.amount),
                        backgroundColor: 'rgba(0, 123, 186, 0.8)',
                        borderColor: 'rgba(0, 123, 186, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return 'Monatlicher Betrag: ' + new Intl.NumberFormat('de-DE', {
                                        style: 'currency',
                                        currency: 'EUR'
                                    }).format(context.parsed.y);
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return new Intl.NumberFormat('de-DE', {
                                        style: 'currency',
                                        currency: 'EUR',
                                        minimumFractionDigits: 0
                                    }).format(value);
                                }
                            }
                        }
                    }
                }
            });
        }
    </script>
</body>
</html>`,
        {
          headers: { "Content-Type": "text/html" },
        }
      );
    }

    return new Response("Not Found", { status: 404 });
  },
};

// Weekly CSV Processing Handler
async function handleWeeklyCSVProcessing(request, env) {
  try {
    const formData = await request.formData();
    const csvFile = formData.get("csv");

    if (!csvFile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No CSV file provided",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const csvText = await csvFile.text();
    const lines = csvText.split("\n");
    const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());

    const deals = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const values = line.split(",").map((v) => v.replace(/"/g, "").trim());
        const deal = {};
        headers.forEach((header, index) => {
          deal[header] = values[index] || "";
        });
        deals.push(deal);
      }
    }

    // Filter won deals for liquidity forecast
    const wonDeals = deals.filter(
      (deal) => deal["Deal - Status"] === "Gewonnen"
    );

    // Load monthly revenues from KV
    let monthlyRevenues = [];
    try {
      monthlyRevenues =
        (await env.MONTHLY_REVENUE_KV.get("revenues", "json")) || [];
    } catch (error) {
      console.warn("Could not load monthly revenues:", error);
      // Continue without monthly revenues if loading fails
    }

    // Calculate weekly liquidity forecast with monthly revenues
    const weeklyLiquidityForecast = calculateWeeklyLiquidityForecast(
      wonDeals,
      monthlyRevenues
    );

    // Calculate weekly deal statistics
    const weeklyDealStats = calculateWeeklyDealStats(deals);

    // Calculate totals
    const totalDealValue = wonDeals.reduce(
      (sum, deal) => sum + parseFloat(deal["Deal - Wert"] || 0),
      0
    );

    const result = {
      wonDeals: wonDeals.length,
      totalDealValue,
      liquidityForecast: weeklyLiquidityForecast,
      weeklyDealStats,
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Weekly CSV processing error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to process CSV",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

// Monthly Revenue Management Functions

// Get all monthly revenues
async function getMonthlyRevenues(env) {
  try {
    const revenues = await env.MONTHLY_REVENUE_KV.get("revenues", "json");

    return new Response(
      JSON.stringify({
        success: true,
        data: revenues || [],
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching monthly revenues:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch monthly revenues",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

// Add a new monthly revenue
async function addMonthlyRevenue(request, env) {
  try {
    const newRevenue = await request.json();

    // Validate required fields
    if (
      !newRevenue.type ||
      !newRevenue.year ||
      !newRevenue.month ||
      !newRevenue.amount
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Get existing revenues
    const revenues =
      (await env.MONTHLY_REVENUE_KV.get("revenues", "json")) || [];

    // Add new revenue with generated ID and timestamp if not provided
    const revenueToAdd = {
      ...newRevenue,
      id: newRevenue.id || `${Date.now()}-${Math.random()}`,
      createdAt: newRevenue.createdAt || new Date().toISOString(),
    };

    revenues.push(revenueToAdd);

    // Save back to KV
    await env.MONTHLY_REVENUE_KV.put("revenues", JSON.stringify(revenues));

    return new Response(
      JSON.stringify({
        success: true,
        data: revenueToAdd,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error adding monthly revenue:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to add monthly revenue",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}

// Delete a monthly revenue
async function deleteMonthlyRevenue(id, env) {
  try {
    // Get existing revenues
    const revenues =
      (await env.MONTHLY_REVENUE_KV.get("revenues", "json")) || [];

    // Filter out the revenue with the given id
    const updatedRevenues = revenues.filter((r) => r.id !== id);

    if (revenues.length === updatedRevenues.length) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Revenue not found",
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Save back to KV
    await env.MONTHLY_REVENUE_KV.put(
      "revenues",
      JSON.stringify(updatedRevenues)
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Revenue deleted successfully",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error deleting monthly revenue:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to delete monthly revenue",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
