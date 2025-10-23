import React from "react";

interface OverviewData {
  week?: string;
  month?: string;
  amount: number;
  formattedAmount: string;
  dealAmount?: number;
  formattedDealAmount?: string;
  partnerschaften?: number;
  formattedPartnerschaften?: string;
  previousRevenue?: number;
  formattedPreviousRevenue?: string;
  cumulativeBalance: number;
  formattedCumulativeBalance: string;
}

interface OverviewTableProps {
  viewMode: "weekly" | "monthly";
  data: OverviewData[];
  expanded: boolean;
  onToggle: () => void;
}

export default function OverviewTable({
  viewMode,
  data,
  expanded,
  onToggle,
}: OverviewTableProps) {
  const formatPeriodLabel = (item: OverviewData) => {
    if (viewMode === "weekly") {
      return item.week || "Keine Woche";
    } else {
      return item.month
        ? new Date(item.month + "-01").toLocaleDateString("de-DE", {
            month: "long",
            year: "numeric",
          })
        : "Kein Monat";
    }
  };

  const formatPeriodReference = (item: OverviewData) => {
    if (viewMode === "weekly") {
      return item.week || "";
    } else {
      return item.month || "";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div
        className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {viewMode === "weekly" ? "Wochen" : "Monats"}übersicht
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Detaillierte{" "}
                {viewMode === "weekly" ? "wöchentliche" : "monatliche"}{" "}
                Liquiditätsplanung mit kumulativem Übertrag
              </p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              expanded ? "rotate-180" : ""
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
      {expanded && (
        <div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {viewMode === "weekly" ? "Woche" : "Monat"}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Referenz
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Deals
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Partnerschaften
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-green-600 uppercase tracking-wider">
                    Vorjahresumsätze
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Gesamt Cashflow
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Kumulativer Übertrag
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.length > 0 ? (
                  data.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPeriodLabel(item)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPeriodReference(item)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                        {item.formattedDealAmount || item.formattedAmount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium text-right">
                        {item.formattedPartnerschaften || "€0,00"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium text-right">
                        {item.formattedPreviousRevenue || "€0,00"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-right">
                        {item.formattedAmount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-right">
                        {item.formattedCumulativeBalance}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-sm text-gray-500"
                    >
                      Keine{" "}
                      {viewMode === "weekly" ? "wöchentlichen" : "monatlichen"}{" "}
                      Daten verfügbar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <svg
                className="w-3 h-3 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Kumulativer Übertrag zeigt die aufsummierten Werte über die Zeit
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
