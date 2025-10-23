import React, { useState, useEffect, useRef } from "react";

interface ForecastData {
  wonDeals: number;
  totalDealValue: number;
  liquidityForecast: {
    monthlyForecast?: Array<{
      month: string;
      amount: number;
      formattedAmount: string;
      cumulativeBalance: number;
      formattedCumulativeBalance: string;
    }>;
    weeklyForecast?: Array<{
      week: string;
      amount: number;
      formattedAmount: string;
      cumulativeBalance: number;
      formattedCumulativeBalance: string;
    }>;
    summary: {
      totalMonths?: number;
      totalWeeks?: number;
      formattedFinalBalance: string;
    };
  };
  monthlyDealStats?: Array<{
    month: string;
    totalDeals: number;
    wonDeals: number;
    lostDeals: number;
    totalValue: number;
    wonValue: number;
    lostValue: number;
    winRate: number;
  }>;
  weeklyDealStats?: Array<{
    week: string;
    totalDeals: number;
    wonDeals: number;
    lostDeals: number;
    totalValue: number;
    wonValue: number;
    lostValue: number;
    winRate: number;
  }>;
}

export default function LiquidityForecast() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ForecastData | null>(null);
  const [viewMode, setViewMode] = useState<"weekly" | "monthly">("weekly");
  const [error, setError] = useState<string | null>(null);
  const [dealStatsExpanded, setDealStatsExpanded] = useState(false);
  const [monthlyTableExpanded, setMonthlyTableExpanded] = useState(false);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const cumulativeChartRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setSelectedFile(file);
      setError(null);
      // Automatically process the file
      await processFile(file);
    } else {
      setError("Bitte wählen Sie eine gültige CSV-Datei aus");
    }
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === "text/csv") {
      setSelectedFile(file);
      setError(null);
      // Automatically process the file
      await processFile(file);
    } else {
      setError("Bitte ziehen Sie eine gültige CSV-Datei hierher");
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const createCharts = (data: ForecastData) => {
    // Load Chart.js dynamically
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js";
    script.onload = () => {
      if (viewMode === "weekly") {
        createWeeklyChart(data);
        createWeeklyCumulativeChart(data);
      } else {
        createMonthlyChart(data);
        createCumulativeChart(data);
      }
    };
    document.head.appendChild(script);
  };

  const createMonthlyChart = (data: ForecastData) => {
    if (!chartRef.current) return;

    // Destroy existing chart if it exists
    if (
      (window as any).Chart &&
      (window as any).Chart.getChart(chartRef.current)
    ) {
      (window as any).Chart.getChart(chartRef.current).destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Sort data chronologically (oldest first) for chart display
    const sortedData = [...data.liquidityForecast.monthlyForecast].sort(
      (a, b) => a.month.localeCompare(b.month)
    );

    const months = sortedData.map((item) => {
      const date = new Date(item.month + "-01");
      return date.toLocaleDateString("de-DE", {
        month: "long",
        year: "numeric",
      });
    });
    const amounts = sortedData.map((item) => item.amount);

    new (window as any).Chart(ctx, {
      type: "bar",
      data: {
        labels: months,
        datasets: [
          {
            label: "Monatlicher Cashflow (€)",
            data: amounts,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            borderColor: "rgba(0, 0, 0, 1)",
            borderWidth: 0,
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            titleColor: "white",
            bodyColor: "white",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            callbacks: {
              label: function (context: any) {
                return new Intl.NumberFormat("de-DE", {
                  style: "currency",
                  currency: "EUR",
                }).format(context.parsed.y);
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
            ticks: {
              font: {
                size: 14,
              },
              callback: function (value: any) {
                return new Intl.NumberFormat("de-DE", {
                  style: "currency",
                  currency: "EUR",
                  minimumFractionDigits: 0,
                }).format(value);
              },
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 14,
              },
            },
          },
        },
      },
    });
  };

  const createCumulativeChart = (data: ForecastData) => {
    if (!cumulativeChartRef.current) return;

    // Destroy existing chart if it exists
    if (
      (window as any).Chart &&
      (window as any).Chart.getChart(cumulativeChartRef.current)
    ) {
      (window as any).Chart.getChart(cumulativeChartRef.current).destroy();
    }

    const ctx = cumulativeChartRef.current.getContext("2d");
    if (!ctx) return;

    // Sort data chronologically (oldest first) for chart display
    const sortedData = [...data.liquidityForecast.monthlyForecast].sort(
      (a, b) => a.month.localeCompare(b.month)
    );

    const months = sortedData.map((item) => {
      const date = new Date(item.month + "-01");
      return date.toLocaleDateString("de-DE", {
        month: "long",
        year: "numeric",
      });
    });
    const cumulative = sortedData.map((item) => item.cumulativeBalance);

    new (window as any).Chart(ctx, {
      type: "line",
      data: {
        labels: months,
        datasets: [
          {
            label: "Kumulativer Übertrag (€)",
            data: cumulative,
            borderColor: "rgba(0, 0, 0, 1)",
            backgroundColor: "rgba(0, 0, 0, 0.05)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "rgba(0, 0, 0, 1)",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            titleColor: "white",
            bodyColor: "white",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            callbacks: {
              label: function (context: any) {
                return new Intl.NumberFormat("de-DE", {
                  style: "currency",
                  currency: "EUR",
                }).format(context.parsed.y);
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
            ticks: {
              font: {
                size: 14,
              },
              callback: function (value: any) {
                return new Intl.NumberFormat("de-DE", {
                  style: "currency",
                  currency: "EUR",
                  minimumFractionDigits: 0,
                }).format(value);
              },
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 14,
              },
            },
          },
        },
      },
    });
  };

  const createWeeklyChart = (data: ForecastData) => {
    if (!chartRef.current) return;

    // Destroy existing chart if it exists
    if (
      (window as any).Chart &&
      (window as any).Chart.getChart(chartRef.current)
    ) {
      (window as any).Chart.getChart(chartRef.current).destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Sort data chronologically (oldest first) for chart display
    const sortedData = [...(data.liquidityForecast.weeklyForecast || [])].sort(
      (a, b) => a.week.localeCompare(b.week)
    );

    const weeks = sortedData.map((item) => item.week);
    const amounts = sortedData.map((item) => item.amount);

    new (window as any).Chart(ctx, {
      type: "bar",
      data: {
        labels: weeks,
        datasets: [
          {
            label: "Wöchentlicher Cashflow (€)",
            data: amounts,
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            borderColor: "rgba(0, 0, 0, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            titleColor: "white",
            bodyColor: "white",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            callbacks: {
              label: function (context: any) {
                return new Intl.NumberFormat("de-DE", {
                  style: "currency",
                  currency: "EUR",
                }).format(context.parsed.y);
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
            ticks: {
              font: {
                size: 14,
              },
              callback: function (value: any) {
                return new Intl.NumberFormat("de-DE", {
                  style: "currency",
                  currency: "EUR",
                  minimumFractionDigits: 0,
                }).format(value);
              },
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 14,
              },
            },
          },
        },
      },
    });
  };

  const createWeeklyCumulativeChart = (data: ForecastData) => {
    if (!cumulativeChartRef.current) return;

    // Destroy existing chart if it exists
    if (
      (window as any).Chart &&
      (window as any).Chart.getChart(cumulativeChartRef.current)
    ) {
      (window as any).Chart.getChart(cumulativeChartRef.current).destroy();
    }

    const ctx = cumulativeChartRef.current.getContext("2d");
    if (!ctx) return;

    // Sort data chronologically (oldest first) for chart display
    const sortedData = [...(data.liquidityForecast.weeklyForecast || [])].sort(
      (a, b) => a.week.localeCompare(b.week)
    );

    const weeks = sortedData.map((item) => item.week);
    const cumulative = sortedData.map((item) => item.cumulativeBalance);

    new (window as any).Chart(ctx, {
      type: "line",
      data: {
        labels: weeks,
        datasets: [
          {
            label: "Kumulativer Übertrag (€)",
            data: cumulative,
            borderColor: "rgba(0, 0, 0, 1)",
            backgroundColor: "rgba(0, 0, 0, 0.05)",
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "rgba(0, 0, 0, 1)",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            titleColor: "white",
            bodyColor: "white",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            callbacks: {
              label: function (context: any) {
                return new Intl.NumberFormat("de-DE", {
                  style: "currency",
                  currency: "EUR",
                }).format(context.parsed.y);
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
            ticks: {
              font: {
                size: 14,
              },
              callback: function (value: any) {
                return new Intl.NumberFormat("de-DE", {
                  style: "currency",
                  currency: "EUR",
                  minimumFractionDigits: 0,
                }).format(value);
              },
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 14,
              },
            },
          },
        },
      },
    });
  };

  const getNextMonth = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toISOString().substring(0, 7); // YYYY-MM
  };

  const isNextMonth = (month: string) => {
    return month === getNextMonth();
  };

  const getCurrentPeriodData = (data: ForecastData) => {
    if (viewMode === "weekly") {
      const sortedData = [
        ...(data.liquidityForecast.weeklyForecast || []),
      ].sort((a, b) => a.week.localeCompare(b.week));
      return sortedData[0]; // Erste Woche
    } else {
      const sortedData = [
        ...(data.liquidityForecast.monthlyForecast || []),
      ].sort((a, b) => a.month.localeCompare(b.month));
      return sortedData[0]; // Erster Monat
    }
  };

  const getNextPeriodData = (data: ForecastData) => {
    if (viewMode === "weekly") {
      const sortedData = [
        ...(data.liquidityForecast.weeklyForecast || []),
      ].sort((a, b) => a.week.localeCompare(b.week));
      return sortedData[1]; // Zweite Woche
    } else {
      const sortedData = [
        ...(data.liquidityForecast.monthlyForecast || []),
      ].sort((a, b) => a.month.localeCompare(b.month));
      return sortedData[1]; // Zweiter Monat
    }
  };

  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("csv", file);

    try {
      const endpoint =
        viewMode === "weekly"
          ? "http://localhost:8787/process-csv-weekly"
          : "http://localhost:8787/process-csv";

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        // Create charts after a short delay to ensure DOM is ready
        setTimeout(() => createCharts(data.data), 100);
      } else {
        setError(data.error || "Fehler beim Verarbeiten der CSV-Datei");
      }
    } catch (err) {
      setError("Verbindungsfehler: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const processCSV = async () => {
    if (!selectedFile) {
      setError("Bitte wählen Sie zuerst eine CSV-Datei aus");
      return;
    }
    await processFile(selectedFile);
  };

  return (
    <div>
      {/* Logo */}
      <div className="flex justify-center pt-8 pb-4">
        <img
          src="https://www.vollpension.wien/wp-content/themes/vollpension-basic/img/header-logos/vollpension-desktop-blau.svg"
          alt="Vollpension Logo"
          className="h-16 w-auto"
        />
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-4 bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-3">
          <span
            className={`text-sm font-medium ${
              viewMode === "weekly" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Wöchentlich
          </span>
          <label
            htmlFor="toggle-view"
            className="flex items-center cursor-pointer"
          >
            <div className="relative">
              <input
                type="checkbox"
                id="toggle-view"
                className="sr-only"
                checked={viewMode === "monthly"}
                onChange={() =>
                  setViewMode((prevMode) =>
                    prevMode === "weekly" ? "monthly" : "weekly"
                  )
                }
              />
              <div
                className={`block w-12 h-6 rounded-full transition-colors ${
                  viewMode === "monthly" ? "bg-blue-600" : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                  viewMode === "monthly" ? "transform translate-x-6" : ""
                }`}
              ></div>
            </div>
          </label>
          <span
            className={`text-sm font-medium ${
              viewMode === "monthly" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Monatlich
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Upload Section - Only show if no result */}
        {!result && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 mb-12">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-6">
                <svg
                  className="w-8 h-8 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                CSV-Datei hochladen
              </h2>
              <p className="text-gray-600 text-lg">
                Laden Sie Ihre Deal-Daten hoch, um eine Liquiditätsplanung zu
                erstellen
              </p>
            </div>

            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center hover:border-gray-400 hover:bg-gray-50/50 cursor-pointer transition-all duration-300 group"
              onClick={() => document.getElementById("csvFile")?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="text-5xl mb-6 text-gray-400 group-hover:text-gray-500 transition-colors">
                📄
              </div>
              <p className="text-lg text-gray-700 mb-3 font-medium">
                Klicken Sie hier oder ziehen Sie eine CSV-Datei hierher
              </p>
              <p className="text-sm text-gray-500">
                Nur CSV-Dateien werden akzeptiert
              </p>
            </div>

            <input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFile && (
              <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-800 font-medium text-lg">
                      {selectedFile.name}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Datei erfolgreich ausgewählt
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center mt-10">
              <button
                onClick={processCSV}
                disabled={!selectedFile || loading}
                className="bg-gray-900 text-white px-12 py-4 rounded-xl font-semibold text-lg shadow-sm hover:shadow-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Verarbeite CSV...
                  </div>
                ) : (
                  "Liquiditätsplanung erstellen"
                )}
              </button>
            </div>

            {error && (
              <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="ml-4">
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600 font-medium text-lg">
              Analysiere Deals und erstelle Liquiditätsplanung...
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <button
                  onClick={() => {
                    setResult(null);
                    setSelectedFile(null);
                    setError(null);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Neue Datei hochladen
                </button>
              </div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                Liquiditätsplanung Dashboard
              </h2>
            </div>

            {/* Period Focus KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* This Period */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {viewMode === "weekly"
                      ? getCurrentPeriodData(result)?.week || "Keine Woche"
                      : getCurrentPeriodData(result)?.month
                      ? new Date(
                          getCurrentPeriodData(result)!.month + "-01"
                        ).toLocaleDateString("de-DE", {
                          month: "long",
                          year: "numeric",
                        })
                      : "Kein Monat"}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {getCurrentPeriodData(result)?.formattedAmount || "0,00 €"}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  Erwarteter Umsatz
                  <div className="group relative">
                    <svg
                      className="w-3 h-3 text-gray-400 cursor-help"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                      <div className="font-semibold mb-1">Berechnung:</div>
                      <div>
                        50% des Deal-Werts werden 3 Wochen nach dem gewonnenen
                        Deal bezahlt
                      </div>
                      <div className="mt-1">
                        50% werden 3 Wochen nach dem Event-Datum bezahlt
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Period */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {viewMode === "weekly"
                      ? getNextPeriodData(result)?.week || "Keine Woche"
                      : getNextPeriodData(result)?.month
                      ? new Date(
                          getNextPeriodData(result)!.month + "-01"
                        ).toLocaleDateString("de-DE", {
                          month: "long",
                          year: "numeric",
                        })
                      : "Kein Monat"}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {getNextPeriodData(result)?.formattedAmount || "0,00 €"}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  Erwarteter Umsatz
                  <div className="group relative">
                    <svg
                      className="w-3 h-3 text-gray-400 cursor-help"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                      <div className="font-semibold mb-1">Berechnung:</div>
                      <div>
                        50% des Deal-Werts werden 3 Wochen nach dem gewonnenen
                        Deal bezahlt
                      </div>
                      <div className="mt-1">
                        50% werden 3 Wochen nach dem Event-Datum bezahlt
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="space-y-6">
              {/* Monthly Cashflow Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Monatlicher Cashflow
                </h3>
                <div className="h-80">
                  <canvas ref={chartRef}></canvas>
                </div>
              </div>

              {/* Cumulative Balance Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Kumulativer Übertrag
                  </h3>
                  <div className="group relative">
                    <svg
                      className="w-4 h-4 text-gray-400 cursor-help"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="absolute bottom-full left-0 mb-2 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                      <div className="font-semibold mb-1">
                        Kumulative Berechnung:
                      </div>
                      <div>
                        Der kumulative Betrag zeigt die Summe aller bisherigen
                        Monate
                      </div>
                      <div className="mt-1">
                        Beispiel: November = 1.500€, Dezember = 1.500€ + 4.000€
                        = 5.500€
                      </div>
                      <div className="mt-1">
                        Jeder Monat addiert sich zum vorherigen Gesamtbetrag
                      </div>
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
                <div className="h-80">
                  <canvas ref={cumulativeChartRef}></canvas>
                </div>
              </div>
            </div>

            {/* Deal Statistics Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div
                className="px-6 py-4 border-b border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setDealStatsExpanded(!dealStatsExpanded)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-3 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Deal-Performance nach{" "}
                        {viewMode === "weekly" ? "Wochen" : "Monaten"}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Übersicht aller Deals und deren Status pro{" "}
                        {viewMode === "weekly" ? "Woche" : "Monat"} - sehen Sie
                        wo Sie noch pushen können
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      dealStatsExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              {dealStatsExpanded && (
                <div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Monat
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Gesamt Deals
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Gewonnen
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Verloren
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Win Rate
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Verlorener Wert
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {result.monthlyDealStats?.length > 0 ? (
                          result.monthlyDealStats.map((stat, index) => (
                            <tr
                              key={index}
                              className="hover:bg-gray-50 transition-all duration-200"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-900">
                                      {new Date(
                                        stat.month + "-01"
                                      ).toLocaleDateString("de-DE", {
                                        year: "numeric",
                                        month: "long",
                                      })}
                                    </span>
                                    <span className="text-xs text-gray-500 font-medium">
                                      {stat.month}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-medium text-gray-900">
                                  {stat.totalDeals}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-medium text-green-600">
                                  {stat.wonDeals}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-medium text-red-600">
                                  {stat.lostDeals}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span
                                    className={`font-semibold ${
                                      stat.winRate >= 70
                                        ? "text-green-600"
                                        : stat.winRate >= 50
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {stat.winRate}%
                                  </span>
                                  <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        stat.winRate >= 70
                                          ? "bg-green-500"
                                          : stat.winRate >= 50
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                      }`}
                                      style={{ width: `${stat.winRate}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-medium text-red-600">
                                  {new Intl.NumberFormat("de-DE", {
                                    style: "currency",
                                    currency: "EUR",
                                  }).format(stat.lostValue)}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-6 py-8 text-center text-gray-500"
                            >
                              Keine Deal-Daten für den gewählten Zeitraum
                              verfügbar
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>
                        {result.monthlyDealStats?.length || 0} Monate mit
                        Deal-Aktivität
                      </span>
                      <span>
                        💡 Tipp: Fokus auf Monate mit niedriger Win Rate oder
                        hohen verlorenen Werten
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 relative">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setMonthlyTableExpanded(!monthlyTableExpanded)}
                >
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg
                      className="w-5 h-5 mr-3 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Monatsübersicht
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="group relative">
                      <svg
                        className="w-4 h-4 text-gray-400 cursor-help"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="absolute bottom-full right-0 mb-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                        <div className="font-semibold mb-2">
                          Spalten-Erklärung:
                        </div>
                        <div>
                          <strong>Monat:</strong> Zeitraum der
                          Liquiditätsplanung
                        </div>
                        <div>
                          <strong>Erwarteter Umsatz:</strong> Summe aller
                          Zahlungen in diesem Monat
                        </div>
                        <div>
                          <strong>Kumulativer Übertrag:</strong> Gesamtsumme
                          aller Monate bis hierhin
                        </div>
                        <div className="mt-1 text-gray-300">
                          💡 Hover über die Spalten-Header für Details
                        </div>
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        monthlyTableExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              {monthlyTableExpanded && (
                <div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Monat
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Betrag
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Kumulativ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {result.liquidityForecast.monthlyForecast.map(
                          (item, index) => (
                            <tr
                              key={index}
                              className={`transition-all duration-200 ${
                                isNextMonth(item.month)
                                  ? "bg-yellow-50 border-l-4 border-yellow-400"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-900">
                                        {new Date(
                                          item.month + "-01"
                                        ).toLocaleDateString("de-DE", {
                                          year: "numeric",
                                          month: "long",
                                        })}
                                      </span>
                                      {isNextMonth(item.month) && (
                                        <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                          Nächster Monat
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">
                                      {item.month}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-medium text-gray-900">
                                  {item.formattedAmount}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-semibold text-gray-900">
                                  {item.formattedCumulativeBalance}
                                </span>
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>
                        {result.liquidityForecast.monthlyForecast.length} Monate
                        mit Zahlungseingängen
                      </span>
                      <span>
                        Aktualisiert: {new Date().toLocaleDateString("de-DE")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
