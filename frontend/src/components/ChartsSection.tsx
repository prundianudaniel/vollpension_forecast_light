import React, { useRef, useEffect } from "react";

interface ForecastData {
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
  };
}

interface ChartsSectionProps {
  viewMode: "weekly" | "monthly";
  data: ForecastData;
}

export default function ChartsSection({ viewMode, data }: ChartsSectionProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const cumulativeChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    createCharts();
  }, [viewMode, data]);

  const createCharts = () => {
    // Load Chart.js dynamically
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js";
    script.onload = () => {
      if (viewMode === "weekly") {
        createWeeklyChart();
        createWeeklyCumulativeChart();
      } else {
        createMonthlyChart();
        createCumulativeChart();
      }
    };
    document.head.appendChild(script);
  };

  const createMonthlyChart = () => {
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
    const sortedData = [...(data.liquidityForecast.monthlyForecast || [])].sort(
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

  const createCumulativeChart = () => {
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
    const sortedData = [...(data.liquidityForecast.monthlyForecast || [])].sort(
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

  const createWeeklyChart = () => {
    if (!chartRef.current) return;
    if (!(window as any).Chart) {
      console.error("Chart.js not loaded");
      return;
    }

    // Destroy existing chart if it exists
    const existingChart = (window as any).Chart.getChart(chartRef.current);
    if (existingChart) {
      existingChart.destroy();
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Sort data chronologically (oldest first) for chart display
    const sortedData = [...(data.liquidityForecast.weeklyForecast || [])].sort(
      (a, b) => a.week.localeCompare(b.week)
    );

    const weeks = sortedData.map((item) => item.week);
    const amounts = sortedData.map((item) => item.amount); // Gesamtsumme

    console.log("Creating weekly chart with:", {
      weeks,
      amounts,
      dataDetails: sortedData.map((item) => ({
        week: item.week,
        total: item.amount,
        deals: item.dealAmount || item.amount,
        partnerschaften: item.partnerschaften || 0,
        previousRevenue: item.previousRevenue || 0,
      })),
    });

    new (window as any).Chart(ctx, {
      type: "bar",
      data: {
        labels: weeks,
        datasets: [
          {
            label: "Wöchentlicher Cashflow",
            data: amounts,
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            borderColor: "rgba(0, 0, 0, 1)",
            borderWidth: 1,
            // Store additional data for tooltip
            dealAmounts: sortedData.map(
              (item) => item.dealAmount || item.amount
            ),
            partnerschaften: sortedData.map(
              (item) => item.partnerschaften || 0
            ),
            previousRevenue: sortedData.map(
              (item) => item.previousRevenue || 0
            ),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false, // Keine Legend mehr nötig
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            titleColor: "white",
            bodyColor: "white",
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            callbacks: {
              title: function (tooltipItems: any[]) {
                return tooltipItems[0].label;
              },
              label: function (context: any) {
                const dataset = context.dataset;
                const index = context.dataIndex;
                const dealAmount = dataset.dealAmounts[index];
                const partnerschaften = dataset.partnerschaften[index];
                const previousRevenue = dataset.previousRevenue[index];

                const lines = [];

                // Gesamtsumme
                lines.push(
                  `Gesamt: ${new Intl.NumberFormat("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  }).format(context.parsed.y)}`
                );

                lines.push(""); // Leerzeile

                // Aufteilung
                lines.push(
                  `└─ Deals: ${new Intl.NumberFormat("de-DE", {
                    style: "currency",
                    currency: "EUR",
                  }).format(dealAmount)}`
                );

                if (partnerschaften > 0) {
                  lines.push(
                    `└─ Partnerschaften: ${new Intl.NumberFormat("de-DE", {
                      style: "currency",
                      currency: "EUR",
                    }).format(partnerschaften)}`
                  );
                }

                if (previousRevenue > 0) {
                  lines.push(
                    `└─ Vorjahresumsätze: ${new Intl.NumberFormat("de-DE", {
                      style: "currency",
                      currency: "EUR",
                    }).format(previousRevenue)}`
                  );
                }

                return lines;
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

  const createWeeklyCumulativeChart = () => {
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

  const calculateTotal = () => {
    if (viewMode === "weekly") {
      const total = (data.liquidityForecast.weeklyForecast || []).reduce(
        (sum, item) => sum + item.amount,
        0
      );
      return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(total);
    } else {
      const total = (data.liquidityForecast.monthlyForecast || []).reduce(
        (sum, item) => sum + item.amount,
        0
      );
      return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(total);
    }
  };

  const calculateBreakdown = () => {
    if (viewMode === "weekly") {
      const deals = (data.liquidityForecast.weeklyForecast || []).reduce(
        (sum, item) => sum + (item.dealAmount || item.amount),
        0
      );
      const partnerschaften = (
        data.liquidityForecast.weeklyForecast || []
      ).reduce((sum, item) => sum + (item.partnerschaften || 0), 0);
      return {
        deals,
        partnerschaften,
        formattedDeals: new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: "EUR",
        }).format(deals),
        formattedPartnerschaften: new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: "EUR",
        }).format(partnerschaften),
      };
    } else {
      const deals = (data.liquidityForecast.monthlyForecast || []).reduce(
        (sum, item) => sum + (item.dealAmount || item.amount),
        0
      );
      const partnerschaften = (
        data.liquidityForecast.monthlyForecast || []
      ).reduce((sum, item) => sum + (item.partnerschaften || 0), 0);
      return {
        deals,
        partnerschaften,
        formattedDeals: new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: "EUR",
        }).format(deals),
        formattedPartnerschaften: new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: "EUR",
        }).format(partnerschaften),
      };
    }
  };

  const exportToExcel = () => {
    // Create CSV content
    let csvContent = "";
    let total = 0;

    if (viewMode === "weekly") {
      const weeklyData = [
        ...(data.liquidityForecast.weeklyForecast || []),
      ].sort((a, b) => a.week.localeCompare(b.week));

      csvContent = "Kalenderwoche,Umsatz (€),Kumulativer Übertrag (€)\n";
      weeklyData.forEach((item) => {
        csvContent += `${item.week},${item.amount.toFixed(
          2
        )},${item.cumulativeBalance.toFixed(2)}\n`;
        total += item.amount;
      });
    } else {
      const monthlyData = [
        ...(data.liquidityForecast.monthlyForecast || []),
      ].sort((a, b) => a.month.localeCompare(b.month));

      csvContent = "Monat,Umsatz (€),Kumulativer Übertrag (€)\n";
      monthlyData.forEach((item) => {
        const monthLabel = new Date(item.month + "-01").toLocaleDateString(
          "de-DE",
          {
            month: "long",
            year: "numeric",
          }
        );
        csvContent += `${monthLabel},${item.amount.toFixed(
          2
        )},${item.cumulativeBalance.toFixed(2)}\n`;
        total += item.amount;
      });
    }

    // Add total row
    csvContent += `\nGesamt,${total.toFixed(2)}\n`;

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `cashflow_${viewMode === "weekly" ? "woechentlich" : "monatlich"}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Cash Flow Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {viewMode === "weekly" ? "Wöchentlicher" : "Monatlicher"} Cashflow
          </h3>
          <div className="flex items-center gap-4">
            <button
              onClick={exportToExcel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Excel Export
            </button>
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
              <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                Zeigt den erwarteten Cashflow pro{" "}
                {viewMode === "weekly" ? "Woche" : "Monat"} basierend auf
                gewonnenen Deals.
              </div>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-medium text-gray-700 mr-2">
              Gesamtsumme:
            </span>
            <span className="text-lg font-bold text-blue-600">
              {calculateTotal()}
            </span>
          </div>
        </div>
        <div className="h-80">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* Cumulative Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
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
            <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              Kumulativer Übertrag zeigt die aufsummierten Werte über die Zeit.
              Jeder Punkt repräsentiert den Gesamtbetrag bis zu diesem
              Zeitpunkt.
            </div>
          </div>
        </div>
        <div className="h-80">
          <canvas ref={cumulativeChartRef}></canvas>
        </div>
      </div>
    </div>
  );
}
