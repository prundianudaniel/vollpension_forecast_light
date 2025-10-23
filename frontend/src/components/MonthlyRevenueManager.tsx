import React, { useState, useEffect } from "react";

type RevenueType = "previous_revenue" | "partnerschaften";

interface MonthlyRevenue {
  id: string;
  type: RevenueType;
  year: number;
  month: number;
  amount: number;
  weight?: number; // Optional, only for previous_revenue
  createdAt: string;
}

// API URL configuration - automatically switches between dev and production
const API_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:8787"
    : "https://vollpension-forecast-light-prod.vollpension.workers.dev";

export default function MonthlyRevenueManager() {
  const [revenues, setRevenues] = useState<MonthlyRevenue[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [selectedType, setSelectedType] =
    useState<RevenueType>("previous_revenue");
  const [amount, setAmount] = useState<string>("");
  const [weight, setWeight] = useState<string>("1");
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from API on mount
  useEffect(() => {
    fetchRevenues();
  }, []);

  const fetchRevenues = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/monthly-revenue`);
      const result = await response.json();

      if (result.success) {
        setRevenues(result.data);
      } else {
        setError(result.error || "Failed to fetch revenues");
      }
    } catch (err) {
      console.error("Failed to fetch revenues:", err);
      setError("Connection error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRevenue = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Bitte geben Sie einen gültigen Betrag ein");
      return;
    }

    // Only validate weight for previous_revenue type
    if (selectedType === "previous_revenue") {
      const weightValue = parseFloat(weight);
      if (!weight || weightValue < 0 || weightValue > 1) {
        alert("Bitte geben Sie ein gültiges Gewicht zwischen 0 und 1 ein");
        return;
      }
    }

    const newRevenue = {
      type: selectedType,
      year: selectedYear,
      month: selectedMonth,
      amount: parseFloat(amount),
      ...(selectedType === "previous_revenue" && {
        weight: parseFloat(weight),
      }),
    };

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/monthly-revenue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRevenue),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the list from server
        await fetchRevenues();
        setAmount("");
        setWeight("1");
        setSelectedType("previous_revenue");
        setIsAdding(false);
      } else {
        alert(result.error || "Fehler beim Speichern des Umsatzes");
      }
    } catch (err) {
      console.error("Failed to add revenue:", err);
      alert("Verbindungsfehler: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRevenue = async (id: string) => {
    if (!confirm("Möchten Sie diesen Eintrag wirklich löschen?")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/monthly-revenue/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        // Refresh the list from server
        await fetchRevenues();
      } else {
        alert(result.error || "Fehler beim Löschen des Umsatzes");
      }
    } catch (err) {
      console.error("Failed to delete revenue:", err);
      alert("Verbindungsfehler: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1);
    return date.toLocaleDateString("de-DE", { month: "long" });
  };

  const getTotalByYear = (year: number) => {
    return revenues
      .filter((r) => r.year === year)
      .reduce((sum, r) => sum + r.amount, 0);
  };

  const getYears = () => {
    const years = new Set(revenues.map((r) => r.year));
    return Array.from(years).sort((a, b) => b - a);
  };

  const getTypeLabel = (type: RevenueType) => {
    return type === "partnerschaften" ? "Partnerschaften" : "Vorjahresumsätze";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Monatliche Umsätze
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Umsatz hinzufügen
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5"
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
            <div>
              <h4 className="text-sm font-semibold text-red-800">Fehler</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="mb-4 flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-3 text-sm text-gray-600">Lädt...</span>
        </div>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            Neuer Monatsumsatz
          </h4>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Typ
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="revenueType"
                  value="previous_revenue"
                  checked={selectedType === "previous_revenue"}
                  onChange={(e) =>
                    setSelectedType(e.target.value as RevenueType)
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  Vorjahresumsätze (mit Gewicht)
                </span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="revenueType"
                  value="partnerschaften"
                  checked={selectedType === "partnerschaften"}
                  onChange={(e) =>
                    setSelectedType(e.target.value as RevenueType)
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  Partnerschaften (fix)
                </span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jahr
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                {generateYearOptions().map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monat
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Betrag (€)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            {selectedType === "previous_revenue" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gewicht (0-1)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="1.0"
                  step="0.1"
                  min="0"
                  max="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddRevenue}
              disabled={loading}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Speichert..." : "Speichern"}
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setAmount("");
                setWeight("1");
                setSelectedType("previous_revenue");
              }}
              disabled={loading}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Data Display */}
      {revenues.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm">Noch keine Umsätze hinzugefügt</p>
        </div>
      ) : (
        <div className="space-y-6">
          {getYears().map((year) => (
            <div key={year}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-semibold text-gray-900">
                  {year}
                </h4>
                <div className="text-sm font-medium text-gray-600">
                  Gesamt: {formatCurrency(getTotalByYear(year))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monat
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Typ
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Betrag
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gewicht
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Erstellt am
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {revenues
                      .filter((r) => r.year === year)
                      .sort((a, b) => a.month - b.month)
                      .map((revenue) => (
                        <tr key={revenue.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {getMonthName(revenue.month)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                revenue.type === "partnerschaften"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {getTypeLabel(revenue.type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                            {formatCurrency(revenue.amount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {revenue.weight !== undefined
                              ? revenue.weight
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 text-right">
                            {new Date(revenue.createdAt).toLocaleDateString(
                              "de-DE"
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <button
                              onClick={() => handleDeleteRevenue(revenue.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
