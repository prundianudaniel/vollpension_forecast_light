import React, { useState } from "react";
import ViewModeToggle from "./ViewModeToggle";
import FileUpload from "./FileUpload";
import PeriodKPIs from "./PeriodKPIs";
import ChartsSection from "./ChartsSection";
import DealPerformanceTable from "./DealPerformanceTable";
import OverviewTable from "./OverviewTable";
import MonthlyRevenueManager from "./MonthlyRevenueManager";

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

export default function LiquidityForecastRefactored() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ForecastData | null>(null);
  const [viewMode, setViewMode] = useState<"weekly" | "monthly">("weekly");
  const [error, setError] = useState<string | null>(null);
  const [dealStatsExpanded, setDealStatsExpanded] = useState(false);
  const [overviewTableExpanded, setOverviewTableExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const isValidCSVFile = (file: File) => {
    return (
      file.type === "text/csv" ||
      file.type === "application/csv" ||
      file.name.toLowerCase().endsWith(".csv")
    );
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file && isValidCSVFile(file)) {
      setSelectedFile(file);
      setError(null);
      await processFile(file);
    } else {
      setError("Bitte wählen Sie eine gültige CSV-Datei aus");
    }
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file && isValidCSVFile(file)) {
      setSelectedFile(file);
      setError(null);
      await processFile(file);
    } else {
      setError("Bitte ziehen Sie eine gültige CSV-Datei hierher");
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const processFile = async (
    file: File,
    mode: "weekly" | "monthly" = viewMode
  ) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("csv", file);

    try {
      // API URL configuration - automatically switches between dev and production
      const API_URL =
        import.meta.env.MODE === "development"
          ? "http://localhost:8787"
          : "https://vollpension-forecast-light-prod.vollpension.workers.dev";

      const endpoint =
        mode === "weekly"
          ? `${API_URL}/process-csv-weekly`
          : `${API_URL}/process-csv`;

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Fehler beim Verarbeiten der CSV-Datei");
      }
    } catch (err) {
      setError("Verbindungsfehler: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPeriodData = () => {
    if (!result) return undefined;

    if (viewMode === "weekly") {
      const sortedData = [
        ...(result.liquidityForecast.weeklyForecast || []),
      ].sort((a, b) => a.week.localeCompare(b.week));
      return sortedData[0];
    } else {
      const sortedData = [
        ...(result.liquidityForecast.monthlyForecast || []),
      ].sort((a, b) => a.month.localeCompare(b.month));
      return sortedData[0];
    }
  };

  const getNextPeriodData = () => {
    if (!result) return undefined;

    if (viewMode === "weekly") {
      const sortedData = [
        ...(result.liquidityForecast.weeklyForecast || []),
      ].sort((a, b) => a.week.localeCompare(b.week));
      return sortedData[1];
    } else {
      const sortedData = [
        ...(result.liquidityForecast.monthlyForecast || []),
      ].sort((a, b) => a.month.localeCompare(b.month));
      return sortedData[1];
    }
  };

  const getDealStats = () => {
    if (!result) return [];

    return viewMode === "weekly"
      ? result.weeklyDealStats || []
      : result.monthlyDealStats || [];
  };

  const getOverviewData = () => {
    if (!result) return [];

    return viewMode === "weekly"
      ? result.liquidityForecast.weeklyForecast || []
      : result.liquidityForecast.monthlyForecast || [];
  };

  const handleViewModeToggle = () => {
    const newMode = viewMode === "weekly" ? "monthly" : "weekly";
    setViewMode(newMode);
    // Reprocess file with new view mode if file is selected
    if (selectedFile) {
      processFile(selectedFile, newMode);
    }
  };

  const handleReset = () => {
    setResult(null);
    setSelectedFile(null);
    setError(null);
    setDealStatsExpanded(false);
    setOverviewTableExpanded(false);
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
      <ViewModeToggle viewMode={viewMode} onToggle={handleViewModeToggle} />

      <div className="max-w-7xl mx-auto">
        {/* Monthly Revenue Manager - Always visible */}
        <div className="mb-8">
          <MonthlyRevenueManager />
        </div>

        {/* Upload Section - Only show if no result */}
        {!result && (
          <FileUpload
            onFileSelect={handleFileSelect}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            loading={loading}
            error={error}
            isDragOver={isDragOver}
          />
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                Liquiditätsplanung Dashboard
              </h2>
            </div>

            {/* Period Focus KPIs */}
            <PeriodKPIs
              viewMode={viewMode}
              currentPeriodData={getCurrentPeriodData()}
              nextPeriodData={getNextPeriodData()}
            />

            {/* Charts Section */}
            <ChartsSection viewMode={viewMode} data={result} />

            {/* Deal Performance Table */}
            <DealPerformanceTable
              viewMode={viewMode}
              dealStats={getDealStats()}
              expanded={dealStatsExpanded}
              onToggle={() => setDealStatsExpanded(!dealStatsExpanded)}
            />

            {/* Overview Table */}
            <OverviewTable
              viewMode={viewMode}
              data={getOverviewData()}
              expanded={overviewTableExpanded}
              onToggle={() => setOverviewTableExpanded(!overviewTableExpanded)}
            />

            {/* Reset Button */}
            <div className="text-center pt-8">
              <button
                onClick={handleReset}
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Neue CSV-Datei hochladen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
