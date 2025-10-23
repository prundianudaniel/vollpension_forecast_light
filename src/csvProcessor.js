/**
 * CSV Processing functionality for Vollpension Forecast
 * Handles CSV file parsing and processing with liquidity forecasting
 */

// Helper function to get ISO week number
function getISOWeek(date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000);
}

// Helper function to get week number in YYYY-WW format
function getWeekNumber(date) {
  const year = date.getFullYear();
  const week = getISOWeek(date);
  return `${year}-W${week.toString().padStart(2, "0")}`;
}

// Helper function to add weeks to a date
function addWeeks(date, weeks) {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

// Helper function to get the last week of a given month
function getLastWeekOfMonth(year, month) {
  // Create date for last day of month
  // month parameter is 1-based (1 = January, 12 = December)
  // JavaScript Date month is 0-based, so we use month directly to get the last day
  // new Date(2024, 12, 0) = last day of December 2024
  const lastDay = new Date(year, month, 0);
  const week = getWeekNumber(lastDay);
  console.log(
    `Last week of ${year}-${month}: ${week} (date: ${lastDay.toISOString()})`
  );
  return week;
}

// Helper function to get all weeks in a given month
function getWeeksInMonth(year, month) {
  const weeks = new Set();

  // Get first and last day of month
  const firstDay = new Date(year, month - 1, 1); // month-1 because JS months are 0-based
  const lastDay = new Date(year, month, 0);

  // Iterate through all days and collect unique weeks
  let currentDate = new Date(firstDay);
  while (currentDate <= lastDay) {
    weeks.add(getWeekNumber(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return Array.from(weeks).sort();
}

function calculateWeeklyLiquidityForecast(wonDeals, monthlyRevenues = []) {
  const weeklyCashFlow = {};
  const weeklyPartnerschaften = {}; // Separate tracking for Partnerschaften
  const weeklyPreviousRevenue = {}; // Separate tracking for Vorjahresumsätze

  wonDeals.forEach((deal) => {
    const dealValue = parseFloat(deal["Deal - Wert"] || 0);
    const dealDateStr = deal["Deal - Datum des gewonnenen Deals"];
    const eventDateStr = deal["Deal - Event Datum"];

    if (!dealDateStr || !eventDateStr || dealValue <= 0) {
      return; // Skip deals without proper data
    }

    try {
      const dealDate = new Date(dealDateStr);
      const eventDate = new Date(eventDateStr);

      // Check if dates are valid
      if (isNaN(dealDate.getTime()) || isNaN(eventDate.getTime())) {
        console.warn("Invalid date found:", dealDateStr, eventDateStr);
        return; // Skip this deal
      }

      // 50% of deal value paid 3 weeks after deal won
      const payment1Date = addWeeks(dealDate, 3);
      const week1 = getWeekNumber(payment1Date);

      // 50% of deal value paid 3 weeks after event
      const payment2Date = addWeeks(eventDate, 3);
      const week2 = getWeekNumber(payment2Date);

      // Add to weekly cash flow
      weeklyCashFlow[week1] = (weeklyCashFlow[week1] || 0) + dealValue * 0.5;
      weeklyCashFlow[week2] = (weeklyCashFlow[week2] || 0) + dealValue * 0.5;
    } catch (error) {
      console.error("Error processing deal dates:", error);
    }
  });

  // Add Partnerschaften revenues to the last week of each month
  console.log("Monthly revenues received:", monthlyRevenues);
  if (monthlyRevenues && monthlyRevenues.length > 0) {
    const partnerschaften = monthlyRevenues.filter(
      (rev) => rev.type === "partnerschaften"
    );

    console.log("Partnerschaften found:", partnerschaften);

    partnerschaften.forEach((rev) => {
      const lastWeek = getLastWeekOfMonth(rev.year, rev.month);
      weeklyPartnerschaften[lastWeek] =
        (weeklyPartnerschaften[lastWeek] || 0) + rev.amount;
      console.log(
        `Added ${rev.amount}€ to week ${lastWeek} for ${rev.year}-${rev.month}`
      );
    });

    // Add Vorjahresumsätze (previous_revenue) distributed across all weeks of the month
    const previousRevenues = monthlyRevenues.filter(
      (rev) => rev.type === "previous_revenue"
    );

    console.log("Previous revenues found:", previousRevenues);

    // Group by year-month and calculate weighted sum
    const monthlyWeightedRevenue = {};
    previousRevenues.forEach((rev) => {
      const monthKey = `${rev.year}-${rev.month}`;
      const weight = rev.weight !== undefined ? rev.weight : 1;
      const weightedAmount = rev.amount * weight;

      if (!monthlyWeightedRevenue[monthKey]) {
        monthlyWeightedRevenue[monthKey] = {
          year: rev.year,
          month: rev.month,
          totalWeightedAmount: 0,
        };
      }

      monthlyWeightedRevenue[monthKey].totalWeightedAmount += weightedAmount;
      console.log(
        `Previous revenue: ${rev.amount}€ × ${weight} = ${weightedAmount}€ for ${monthKey}`
      );
    });

    // Distribute to all weeks of each month
    Object.values(monthlyWeightedRevenue).forEach((monthData) => {
      const weeklyAmount = monthData.totalWeightedAmount / 4.33; // Average weeks per month

      console.log(
        `Month ${monthData.year}-${monthData.month}: Total weighted ${monthData.totalWeightedAmount}€ ÷ 4.33 = ${weeklyAmount}€ per week`
      );

      // Find all weeks in this month
      const weeksInMonth = getWeeksInMonth(monthData.year, monthData.month);

      weeksInMonth.forEach((week) => {
        weeklyPreviousRevenue[week] =
          (weeklyPreviousRevenue[week] || 0) + weeklyAmount;
        console.log(`Added ${weeklyAmount}€ previous revenue to week ${week}`);
      });
    });
  }

  console.log("Weekly Partnerschaften:", weeklyPartnerschaften);
  console.log("Weekly Previous Revenue:", weeklyPreviousRevenue);

  // Get current week for filtering
  const currentWeek = getWeekNumber(new Date());

  // Combine all weeks from cash flow, partnerschaften, and previous revenue
  const allWeeks = new Set([
    ...Object.keys(weeklyCashFlow),
    ...Object.keys(weeklyPartnerschaften),
    ...Object.keys(weeklyPreviousRevenue),
  ]);

  // Convert to array, filter future weeks, and sort by week (newest first)
  const forecastArray = Array.from(allWeeks)
    .filter((week) => week >= currentWeek) // Only show current and future weeks
    .map((week) => {
      const dealAmount = weeklyCashFlow[week] || 0;
      const partnerschaften = weeklyPartnerschaften[week] || 0;
      const previousRevenue = weeklyPreviousRevenue[week] || 0;
      const totalAmount = dealAmount + partnerschaften + previousRevenue;

      return {
        week,
        amount: Math.round(totalAmount * 100) / 100, // Total amount
        dealAmount: Math.round(dealAmount * 100) / 100, // Separate deal amount
        partnerschaften: Math.round(partnerschaften * 100) / 100, // Separate partnerschaften
        previousRevenue: Math.round(previousRevenue * 100) / 100, // Separate previous revenue
        formattedAmount: new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: "EUR",
        }).format(totalAmount),
        formattedDealAmount: new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: "EUR",
        }).format(dealAmount),
        formattedPartnerschaften: new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: "EUR",
        }).format(partnerschaften),
        formattedPreviousRevenue: new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: "EUR",
        }).format(previousRevenue),
      };
    })
    .sort((a, b) => b.week.localeCompare(a.week)); // Sort newest first

  // Calculate cumulative balance (Übertrag) - sort chronologically first
  let cumulativeBalance = 0;
  const sortedForCumulative = [...forecastArray].sort((a, b) =>
    a.week.localeCompare(b.week)
  );
  const forecastWithBalance = sortedForCumulative.map((item) => {
    cumulativeBalance += item.amount;
    return {
      ...item,
      cumulativeBalance: Math.round(cumulativeBalance * 100) / 100,
      formattedCumulativeBalance: new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(cumulativeBalance),
    };
  });

  return {
    weeklyForecast: forecastWithBalance,
    summary: {
      totalWeeks: forecastArray.length,
      formattedFinalBalance: new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(cumulativeBalance),
    },
  };
}

function calculateLiquidityForecast(wonDeals) {
  const monthlyCashFlow = {};

  wonDeals.forEach((deal) => {
    const dealValue = parseFloat(deal["Deal - Wert"] || 0);
    const dealDateStr = deal["Deal - Datum des gewonnenen Deals"];
    const eventDateStr = deal["Deal - Event Datum"];

    if (!dealDateStr || !eventDateStr || dealValue <= 0) {
      return; // Skip deals without proper data
    }

    try {
      const dealDate = new Date(dealDateStr);
      const eventDate = new Date(eventDateStr);

      // Check if dates are valid
      if (isNaN(dealDate.getTime()) || isNaN(eventDate.getTime())) {
        console.warn("Invalid date found:", { dealDateStr, eventDateStr });
        return; // Skip this deal
      }

      // 50% payment within 3 weeks of deal date
      const payment1Date = new Date(dealDate);
      payment1Date.setDate(payment1Date.getDate() + 21); // 3 weeks
      const payment1Month = payment1Date.toISOString().substring(0, 7); // YYYY-MM

      // 50% payment 3 weeks after event date
      const payment2Date = new Date(eventDate);
      payment2Date.setDate(payment2Date.getDate() + 21); // 3 weeks
      const payment2Month = payment2Date.toISOString().substring(0, 7); // YYYY-MM

      // Add to monthly cash flow
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

  // Convert to array and sort by month (newest first)
  const forecastArray = Object.entries(monthlyCashFlow)
    .map(([month, amount]) => ({
      month,
      amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
      formattedAmount: new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(amount),
    }))
    .sort((a, b) => b.month.localeCompare(a.month));

  // Calculate cumulative balance (Übertrag) - sort chronologically first
  let cumulativeBalance = 0;
  const sortedForCumulative = [...forecastArray].sort((a, b) =>
    a.month.localeCompare(b.month)
  );
  const forecastWithBalance = sortedForCumulative.map((item) => {
    cumulativeBalance += item.amount;
    return {
      ...item,
      cumulativeBalance: Math.round(cumulativeBalance * 100) / 100,
      formattedCumulativeBalance: new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(cumulativeBalance),
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
      averageMonthlyAmount:
        forecastArray.length > 0
          ? Math.round(
              (forecastArray.reduce((sum, item) => sum + item.amount, 0) /
                forecastArray.length) *
                100
            ) / 100
          : 0,
      finalBalance: cumulativeBalance,
      formattedFinalBalance: new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
      }).format(cumulativeBalance),
    },
  };
}

function calculateWeeklyDealStats(allDeals) {
  const weeklyStats = {};

  allDeals.forEach((deal) => {
    const dealValue = parseFloat(deal["Deal - Wert"] || 0);
    const status = deal["Deal - Status"];

    // For won deals, use "Deal - Datum des gewonnenen Deals"
    // For lost deals, use "Deal - Datum des verlorenen Deals"
    let dealDateStr;
    if (status === "Gewonnen") {
      dealDateStr = deal["Deal - Datum des gewonnenen Deals"];
    } else if (status === "Verloren") {
      dealDateStr = deal["Deal - Datum des verlorenen Deals"];
    }

    if (!dealDateStr || dealValue <= 0) {
      return; // Skip deals without proper data
    }

    try {
      const dealDate = new Date(dealDateStr);

      // Check if date is valid
      if (isNaN(dealDate.getTime())) {
        console.warn("Invalid date found:", dealDateStr);
        return; // Skip this deal
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
          winRate: 0,
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

      // Calculate win rate
      weeklyStats[week].winRate =
        weeklyStats[week].totalDeals > 0
          ? Math.round(
              (weeklyStats[week].wonDeals / weeklyStats[week].totalDeals) * 100
            )
          : 0;
    } catch (error) {
      console.error("Error processing deal date:", error);
    }
  });

  // Convert to array and sort by week (newest first)
  return Object.values(weeklyStats).sort((a, b) =>
    b.week.localeCompare(a.week)
  );
}

function calculateMonthlyDealStats(allDeals) {
  const monthlyStats = {};

  allDeals.forEach((deal) => {
    const dealValue = parseFloat(deal["Deal - Wert"] || 0);
    const status = deal["Deal - Status"];

    // For won deals, use "Deal - Datum des gewonnenen Deals"
    // For lost deals, use "Deal - Datum des verlorenen Deals"
    let dealDateStr;
    if (status === "Gewonnen") {
      dealDateStr = deal["Deal - Datum des gewonnenen Deals"];
    } else if (status === "Verloren") {
      dealDateStr = deal["Deal - Datum des verlorenen Deals"];
    }

    if (!dealDateStr || dealValue <= 0) {
      return; // Skip deals without proper data
    }

    try {
      const dealDate = new Date(dealDateStr);

      // Check if date is valid
      if (isNaN(dealDate.getTime())) {
        console.warn("Invalid date found:", dealDateStr);
        return; // Skip this deal
      }

      const month = dealDate.toISOString().substring(0, 7); // YYYY-MM

      if (!monthlyStats[month]) {
        monthlyStats[month] = {
          month,
          totalDeals: 0,
          wonDeals: 0,
          lostDeals: 0,
          totalValue: 0,
          wonValue: 0,
          lostValue: 0,
          winRate: 0,
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

      // Calculate win rate
      monthlyStats[month].winRate =
        monthlyStats[month].totalDeals > 0
          ? Math.round(
              (monthlyStats[month].wonDeals / monthlyStats[month].totalDeals) *
                100
            )
          : 0;
    } catch (error) {
      console.error("Error processing deal date:", error);
    }
  });

  // Convert to array and sort by month (newest first)
  return Object.values(monthlyStats).sort((a, b) =>
    b.month.localeCompare(a.month)
  );
}

export { calculateWeeklyLiquidityForecast, calculateWeeklyDealStats };

export async function handleCSVProcessing(request) {
  try {
    const formData = await request.formData();
    const csvFile = formData.get("csv");

    if (!csvFile) {
      return new Response(JSON.stringify({ error: "No CSV file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Read CSV content
    const csvText = await csvFile.text();

    // Parse CSV
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

    // Filter only won deals
    const wonDeals = rows.filter((row) => row["Deal - Status"] === "Gewonnen");

    // Process liquidity forecast
    const liquidityForecast = calculateLiquidityForecast(wonDeals);

    // Process monthly deal statistics
    const monthlyDealStats = calculateMonthlyDealStats(rows);

    // Process the data with liquidity forecasting
    const processedData = {
      totalRows: rows.length,
      wonDeals: wonDeals.length,
      totalDealValue: wonDeals.reduce(
        (sum, deal) => sum + parseFloat(deal["Deal - Wert"] || 0),
        0
      ),
      headers: headers,
      sampleData: rows.slice(0, 5), // First 5 rows as sample
      liquidityForecast: liquidityForecast,
      monthlyDealStats: monthlyDealStats,
      summary: {
        columns: headers.length,
        rows: rows.length,
        wonDealsCount: wonDeals.length,
        timestamp: new Date().toISOString(),
      },
    };

    return new Response(
      JSON.stringify({
        success: true,
        message: "CSV processed successfully",
        data: processedData,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to process CSV",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
