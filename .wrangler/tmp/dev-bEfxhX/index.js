var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-lUtrlO/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-lUtrlO/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/csvProcessor.js
function getISOWeek(date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + (4 - target.getDay() + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target) / 6048e5);
}
__name(getISOWeek, "getISOWeek");
function getWeekNumber(date) {
  const year = date.getFullYear();
  const week = getISOWeek(date);
  return `${year}-W${week.toString().padStart(2, "0")}`;
}
__name(getWeekNumber, "getWeekNumber");
function addWeeks(date, weeks) {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}
__name(addWeeks, "addWeeks");
function calculateWeeklyLiquidityForecast(wonDeals) {
  const weeklyCashFlow = {};
  wonDeals.forEach((deal) => {
    const dealValue = parseFloat(deal["Deal - Wert"] || 0);
    const dealDateStr = deal["Deal - Datum des gewonnenen Deals"];
    const eventDateStr = deal["Deal - Event Datum"];
    if (!dealDateStr || !eventDateStr || dealValue <= 0) {
      return;
    }
    try {
      const dealDate = new Date(dealDateStr);
      const eventDate = new Date(eventDateStr);
      if (isNaN(dealDate.getTime()) || isNaN(eventDate.getTime())) {
        console.warn("Invalid date found:", dealDateStr, eventDateStr);
        return;
      }
      const payment1Date = addWeeks(dealDate, 3);
      const week1 = getWeekNumber(payment1Date);
      const payment2Date = addWeeks(eventDate, 3);
      const week2 = getWeekNumber(payment2Date);
      weeklyCashFlow[week1] = (weeklyCashFlow[week1] || 0) + dealValue * 0.5;
      weeklyCashFlow[week2] = (weeklyCashFlow[week2] || 0) + dealValue * 0.5;
    } catch (error) {
      console.error("Error processing deal dates:", error);
    }
  });
  const currentWeek = getWeekNumber(/* @__PURE__ */ new Date());
  const forecastArray = Object.entries(weeklyCashFlow).filter(([week]) => week >= currentWeek).map(([week, amount]) => ({
    week,
    amount: Math.round(amount * 100) / 100,
    // Round to 2 decimal places
    formattedAmount: new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR"
    }).format(amount)
  })).sort((a, b) => b.week.localeCompare(a.week));
  let cumulativeBalance = 0;
  const sortedForCumulative = [...forecastArray].sort(
    (a, b) => a.week.localeCompare(b.week)
  );
  const forecastWithBalance = sortedForCumulative.map((item) => {
    cumulativeBalance += item.amount;
    return {
      ...item,
      cumulativeBalance: Math.round(cumulativeBalance * 100) / 100,
      formattedCumulativeBalance: new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR"
      }).format(cumulativeBalance)
    };
  });
  return {
    weeklyForecast: forecastWithBalance,
    summary: {
      totalWeeks: forecastArray.length,
      formattedFinalBalance: new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR"
      }).format(cumulativeBalance)
    }
  };
}
__name(calculateWeeklyLiquidityForecast, "calculateWeeklyLiquidityForecast");
function calculateLiquidityForecast(wonDeals) {
  const monthlyCashFlow = {};
  wonDeals.forEach((deal) => {
    const dealValue = parseFloat(deal["Deal - Wert"] || 0);
    const dealDateStr = deal["Deal - Datum des gewonnenen Deals"];
    const eventDateStr = deal["Deal - Event Datum"];
    if (!dealDateStr || !eventDateStr || dealValue <= 0) {
      return;
    }
    try {
      const dealDate = new Date(dealDateStr);
      const eventDate = new Date(eventDateStr);
      if (isNaN(dealDate.getTime()) || isNaN(eventDate.getTime())) {
        console.warn("Invalid date found:", { dealDateStr, eventDateStr });
        return;
      }
      const payment1Date = new Date(dealDate);
      payment1Date.setDate(payment1Date.getDate() + 21);
      const payment1Month = payment1Date.toISOString().substring(0, 7);
      const payment2Date = new Date(eventDate);
      payment2Date.setDate(payment2Date.getDate() + 21);
      const payment2Month = payment2Date.toISOString().substring(0, 7);
      if (!monthlyCashFlow[payment1Month]) {
        monthlyCashFlow[payment1Month] = 0;
      }
      if (!monthlyCashFlow[payment2Month]) {
        monthlyCashFlow[payment2Month] = 0;
      }
      monthlyCashFlow[payment1Month] += dealValue * 0.5;
      monthlyCashFlow[payment2Month] += dealValue * 0.5;
    } catch (error) {
      console.error("Error processing deal dates:", error);
    }
  });
  const forecastArray = Object.entries(monthlyCashFlow).map(([month, amount]) => ({
    month,
    amount: Math.round(amount * 100) / 100,
    // Round to 2 decimal places
    formattedAmount: new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR"
    }).format(amount)
  })).sort((a, b) => b.month.localeCompare(a.month));
  let cumulativeBalance = 0;
  const sortedForCumulative = [...forecastArray].sort(
    (a, b) => a.month.localeCompare(b.month)
  );
  const forecastWithBalance = sortedForCumulative.map((item) => {
    cumulativeBalance += item.amount;
    return {
      ...item,
      cumulativeBalance: Math.round(cumulativeBalance * 100) / 100,
      formattedCumulativeBalance: new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR"
      }).format(cumulativeBalance)
    };
  });
  return {
    monthlyForecast: forecastWithBalance,
    totalForecastAmount: forecastArray.reduce(
      (sum, item) => sum + item.amount,
      0
    ),
    summary: {
      totalMonths: forecastArray.length,
      averageMonthlyAmount: forecastArray.length > 0 ? Math.round(
        forecastArray.reduce((sum, item) => sum + item.amount, 0) / forecastArray.length * 100
      ) / 100 : 0,
      finalBalance: cumulativeBalance,
      formattedFinalBalance: new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR"
      }).format(cumulativeBalance)
    }
  };
}
__name(calculateLiquidityForecast, "calculateLiquidityForecast");
function calculateWeeklyDealStats(allDeals) {
  const weeklyStats = {};
  allDeals.forEach((deal) => {
    const dealValue = parseFloat(deal["Deal - Wert"] || 0);
    const status = deal["Deal - Status"];
    let dealDateStr;
    if (status === "Gewonnen") {
      dealDateStr = deal["Deal - Datum des gewonnenen Deals"];
    } else if (status === "Verloren") {
      dealDateStr = deal["Deal - Datum des verlorenen Deals"];
    }
    if (!dealDateStr || dealValue <= 0) {
      return;
    }
    try {
      const dealDate = new Date(dealDateStr);
      if (isNaN(dealDate.getTime())) {
        console.warn("Invalid date found:", dealDateStr);
        return;
      }
      const week = getWeekNumber(dealDate);
      if (!weeklyStats[week]) {
        weeklyStats[week] = {
          week,
          totalDeals: 0,
          wonDeals: 0,
          lostDeals: 0,
          totalValue: 0,
          wonValue: 0,
          lostValue: 0,
          winRate: 0
        };
      }
      weeklyStats[week].totalDeals++;
      weeklyStats[week].totalValue += dealValue;
      if (status === "Gewonnen") {
        weeklyStats[week].wonDeals++;
        weeklyStats[week].wonValue += dealValue;
      } else if (status === "Verloren") {
        weeklyStats[week].lostDeals++;
        weeklyStats[week].lostValue += dealValue;
      }
      weeklyStats[week].winRate = weeklyStats[week].totalDeals > 0 ? Math.round(
        weeklyStats[week].wonDeals / weeklyStats[week].totalDeals * 100
      ) : 0;
    } catch (error) {
      console.error("Error processing deal date:", error);
    }
  });
  return Object.values(weeklyStats).sort(
    (a, b) => b.week.localeCompare(a.week)
  );
}
__name(calculateWeeklyDealStats, "calculateWeeklyDealStats");
function calculateMonthlyDealStats(allDeals) {
  const monthlyStats = {};
  allDeals.forEach((deal) => {
    const dealValue = parseFloat(deal["Deal - Wert"] || 0);
    const status = deal["Deal - Status"];
    let dealDateStr;
    if (status === "Gewonnen") {
      dealDateStr = deal["Deal - Datum des gewonnenen Deals"];
    } else if (status === "Verloren") {
      dealDateStr = deal["Deal - Datum des verlorenen Deals"];
    }
    if (!dealDateStr || dealValue <= 0) {
      return;
    }
    try {
      const dealDate = new Date(dealDateStr);
      if (isNaN(dealDate.getTime())) {
        console.warn("Invalid date found:", dealDateStr);
        return;
      }
      const month = dealDate.toISOString().substring(0, 7);
      if (!monthlyStats[month]) {
        monthlyStats[month] = {
          month,
          totalDeals: 0,
          wonDeals: 0,
          lostDeals: 0,
          totalValue: 0,
          wonValue: 0,
          lostValue: 0,
          winRate: 0
        };
      }
      monthlyStats[month].totalDeals++;
      monthlyStats[month].totalValue += dealValue;
      if (status === "Gewonnen") {
        monthlyStats[month].wonDeals++;
        monthlyStats[month].wonValue += dealValue;
      } else if (status === "Verloren") {
        monthlyStats[month].lostDeals++;
        monthlyStats[month].lostValue += dealValue;
      }
      monthlyStats[month].winRate = monthlyStats[month].totalDeals > 0 ? Math.round(
        monthlyStats[month].wonDeals / monthlyStats[month].totalDeals * 100
      ) : 0;
    } catch (error) {
      console.error("Error processing deal date:", error);
    }
  });
  return Object.values(monthlyStats).sort(
    (a, b) => b.month.localeCompare(a.month)
  );
}
__name(calculateMonthlyDealStats, "calculateMonthlyDealStats");
async function handleCSVProcessing(request) {
  try {
    const formData = await request.formData();
    const csvFile = formData.get("csv");
    if (!csvFile) {
      return new Response(JSON.stringify({ error: "No CSV file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const csvText = await csvFile.text();
    const lines = csvText.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      return row;
    });
    const wonDeals = rows.filter((row) => row["Deal - Status"] === "Gewonnen");
    const liquidityForecast = calculateLiquidityForecast(wonDeals);
    const monthlyDealStats = calculateMonthlyDealStats(rows);
    const processedData = {
      totalRows: rows.length,
      wonDeals: wonDeals.length,
      totalDealValue: wonDeals.reduce(
        (sum, deal) => sum + parseFloat(deal["Deal - Wert"] || 0),
        0
      ),
      headers,
      sampleData: rows.slice(0, 5),
      // First 5 rows as sample
      liquidityForecast,
      monthlyDealStats,
      summary: {
        columns: headers.length,
        rows: rows.length,
        wonDealsCount: wonDeals.length,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
    return new Response(
      JSON.stringify({
        success: true,
        message: "CSV processed successfully",
        data: processedData
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to process CSV",
        details: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
__name(handleCSVProcessing, "handleCSVProcessing");

// src/index.js
var src_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
    if (url.pathname === "/process-csv-weekly") {
      return await handleWeeklyCSVProcessing(request);
    }
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          message: "Vollpension Forecast API is running"
        }),
        {
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (url.pathname === "/process-csv" && request.method === "POST") {
      return handleCSVProcessing(request);
    }
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(
        `<!DOCTYPE html>
<html>
<head>
    <title>Vollpension Forecast - Liquidit\xE4tsplanung</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script>
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
        <h1>\u{1F4B0} Vollpension Forecast</h1>
        <p><strong>Liquidit\xE4tsplanung basierend auf gewonnenen Deals</strong></p>
        
        <div class="upload-area" onclick="document.getElementById('csvFile').click()">
            <h3>\u{1F4C1} CSV-Datei hochladen</h3>
            <p>Klicken Sie hier oder ziehen Sie eine CSV-Datei hierher</p>
            <input type="file" id="csvFile" accept=".csv" style="display: none;">
        </div>
        
        <button onclick="processCSV()" id="processBtn">\u{1F680} Liquidit\xE4tsplanung erstellen</button>
        
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
                document.querySelector('.upload-area h3').textContent = '\u2705 ' + selectedFile.name;
                document.querySelector('.upload-area p').textContent = 'Datei ausgew\xE4hlt - bereit zur Verarbeitung';
            }
        }

        async function processCSV() {
            if (!selectedFile) {
                alert('Bitte w\xE4hlen Sie zuerst eine CSV-Datei aus');
                return;
            }

            const processBtn = document.getElementById('processBtn');
            const resultDiv = document.getElementById('result');
            
            // Show loading state
            processBtn.disabled = true;
            processBtn.textContent = '\u23F3 Verarbeite CSV...';
            
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = \`
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Analysiere Deals und erstelle Liquidit\xE4tsplanung...</p>
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
                        <h3>\u274C Fehler beim Verarbeiten</h3>
                        <p>\${error.message}</p>
                    </div>
                \`;
            } finally {
                processBtn.disabled = false;
                processBtn.textContent = '\u{1F680} Liquidit\xE4tsplanung erstellen';
            }
        }

        function displayLiquidityResults(data) {
            const resultDiv = document.getElementById('result');
            
            resultDiv.innerHTML = \`
                <h3>\u{1F4CA} Liquidit\xE4tsplanung Ergebnisse</h3>
                
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
                        <h3>Prognostizierte Liquidit\xE4t</h3>
                        <div class="value">\${data.liquidityForecast.summary.formattedFinalBalance}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Prognose-Monate</h3>
                        <div class="value">\${data.liquidityForecast.summary.totalMonths}</div>
                    </div>
                </div>
                
                <div class="chart-container">
                    <h3>\u{1F4C8} Monatliche Liquidit\xE4tsplanung</h3>
                    <canvas id="liquidityChart" width="400" height="200"></canvas>
                </div>
                
                <h3>\u{1F4CB} Detaillierte Monats\xFCbersicht</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Monat</th>
                            <th>Monatlicher Betrag</th>
                            <th>Kumulativer \xDCbertrag</th>
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
    <\/script>
</body>
</html>`,
        {
          headers: { "Content-Type": "text/html" }
        }
      );
    }
    return new Response("Not Found", { status: 404 });
  }
};
async function handleWeeklyCSVProcessing(request) {
  try {
    const formData = await request.formData();
    const csvFile = formData.get("csv");
    if (!csvFile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No CSV file provided"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
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
    const wonDeals = deals.filter(
      (deal) => deal["Deal - Status"] === "Gewonnen"
    );
    const weeklyLiquidityForecast = calculateWeeklyLiquidityForecast(wonDeals);
    const weeklyDealStats = calculateWeeklyDealStats(deals);
    const totalDealValue = wonDeals.reduce(
      (sum, deal) => sum + parseFloat(deal["Deal - Wert"] || 0),
      0
    );
    const result = {
      wonDeals: wonDeals.length,
      totalDealValue,
      liquidityForecast: weeklyLiquidityForecast,
      weeklyDealStats
    };
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  } catch (error) {
    console.error("Weekly CSV processing error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to process CSV",
        details: error.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
}
__name(handleWeeklyCSVProcessing, "handleWeeklyCSVProcessing");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-lUtrlO/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-lUtrlO/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
