import { Request, Response } from "express";
import { forecastService } from "./forecast.service";
import { forecastRepository } from "./forecast.repository";

export const forecastController = {
  getItemForecast: (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      const forecast = forecastService.calculateItemForecast(itemId);
      res.json(forecast);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
  
  getYearlyForecast: (req: Request, res: Response) => {
    try {
      const year = Number(req.query.year) || 2026;
      const items = forecastRepository.getItems();
      const results = items.map(item => {
        try {
          return forecastService.calculateItemForecast(item.id, year);
        } catch (e) {
          return null;
        }
      }).filter(Boolean);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
  
  getDashboard: (req: Request, res: Response) => {
    try {
      const items = forecastRepository.getItems();
      const forecasts = items.map(item => {
        try {
          return forecastService.calculateItemForecast(item.id);
        } catch (e) {
          return null;
        }
      }).filter(Boolean);
      
      const critical = forecasts.filter((f: any) => f.procurementRequired && f.currentStock < (f.forecast * 0.1));
      
      res.json({
        totalItemsForecasting: forecasts.length,
        criticalItemsCount: critical.length,
        totalProcurementNeed: forecasts.reduce((sum: number, f: any) => sum + f.purchaseRecommendation, 0),
        forecasts: forecasts.slice(0, 10) // Top 10 for dashboard
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};
