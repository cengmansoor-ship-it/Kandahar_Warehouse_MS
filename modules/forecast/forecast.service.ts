import { forecastRepository } from "./forecast.repository";

export const forecastService = {
  calculateItemForecast: (itemId: string, targetYear: number = 2026) => {
    const transactions = forecastRepository.getTransactionsByItem(itemId);
    const item = forecastRepository.getItems().find((i: any) => i.id === itemId);
    
    if (!item) throw new Error("Item not found");

    const outTransactions = transactions.filter((t: any) => t.type === 'OUT');
    
    // 1. Monthly Consumption Calculation
    // Group by Month-Year
    const monthlyUsage: Record<string, number> = {};
    outTransactions.forEach((t: any) => {
      const date = new Date(t.created_at);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyUsage[monthYear] = (monthlyUsage[monthYear] || 0) + (t.quantity || 0);
    });

    const usageValues = Object.values(monthlyUsage);
    
    // 2. Average Monthly Usage
    const avgMonthlyUsage = usageValues.length > 0 
      ? usageValues.reduce((a, b) => a + b, 0) / usageValues.length 
      : 0;

    // 3. Yearly Usage Calculation (Simple estimation based on available data)
    const yearlyUsage = avgMonthlyUsage * 12;

    // 4. Growth Rate (year-over-year)
    // Formula: (current_year - previous_year) / previous_year
    const currentYearUsage = outTransactions
      .filter((t: any) => new Date(t.created_at).getFullYear() === new Date().getFullYear())
      .reduce((sum: number, t: any) => sum + (t.quantity || 0), 0);
      
    const previousYearUsage = outTransactions
      .filter((t: any) => new Date(t.created_at).getFullYear() === new Date().getFullYear() - 1)
      .reduce((sum: number, t: any) => sum + (t.quantity || 0), 0);
    
    let growthRate = 0;
    if (previousYearUsage > 0) {
      growthRate = (currentYearUsage - previousYearUsage) / previousYearUsage;
    } else {
      growthRate = 0.15; // Assumption of 15% growth if no historical data
    }

    // 5. Safety Stock Calculation
    // Formula: (max_daily_usage × max_lead_time) - (avg_daily_usage × avg_lead_time)
    // Mocking lead times since not in data
    const avgLeadTime = 14; 
    const maxLeadTime = 21;
    const avgDailyUsage = avgMonthlyUsage / 30;
    const maxDailyUsage = usageValues.length > 0 ? (Math.max(...usageValues) / 30) : avgDailyUsage * 1.5;
    
    const safetyStock = (maxDailyUsage * maxLeadTime) - (avgDailyUsage * avgLeadTime);

    // 6. Final Forecast (Next Year Needs)
    // Formula: (avg_monthly_usage × 12 × (1 + growth_rate)) + safety_stock
    const forecast = (avgMonthlyUsage * 12 * (1 + growthRate)) + safetyStock;

    return {
      itemId,
      itemName: item.name,
      currentStock: item.quantity,
      avgMonthlyUsage: Math.round(avgMonthlyUsage * 100) / 100,
      yearlyUsage: Math.round(yearlyUsage),
      growthRate: Math.round(growthRate * 100) / 100,
      safetyStock: Math.round(safetyStock),
      forecast: Math.round(forecast),
      procurementRequired: forecast > item.quantity,
      purchaseRecommendation: Math.max(0, Math.round(forecast - item.quantity)),
      monthlyData: monthlyUsage
    };
  }
};
