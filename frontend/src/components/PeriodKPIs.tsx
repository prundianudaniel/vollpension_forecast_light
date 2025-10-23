import React from "react";

interface PeriodData {
  week?: string;
  month?: string;
  formattedAmount: string;
}

interface PeriodKPIsProps {
  viewMode: "weekly" | "monthly";
  currentPeriodData: PeriodData | undefined;
  nextPeriodData: PeriodData | undefined;
}

export default function PeriodKPIs({
  viewMode,
  currentPeriodData,
  nextPeriodData,
}: PeriodKPIsProps) {
  const formatPeriodLabel = (data: PeriodData | undefined) => {
    if (!data) return viewMode === "weekly" ? "Keine Woche" : "Kein Monat";

    if (viewMode === "weekly") {
      return data.week || "Keine Woche";
    } else {
      return data.month
        ? new Date(data.month + "-01").toLocaleDateString("de-DE", {
            month: "long",
            year: "numeric",
          })
        : "Kein Monat";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Current Period */}
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
            {formatPeriodLabel(currentPeriodData)}
          </span>
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {currentPeriodData?.formattedAmount || "0,00 €"}
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
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              Erwarteter Umsatz basierend auf gewonnenen Deals. 50% werden 3
              Wochen nach Deal-Gewinnung bezahlt, 50% 3 Wochen nach Event-Datum.
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
            {formatPeriodLabel(nextPeriodData)}
          </span>
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {nextPeriodData?.formattedAmount || "0,00 €"}
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
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              Erwarteter Umsatz für den nächsten Zeitraum basierend auf
              gewonnenen Deals.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
