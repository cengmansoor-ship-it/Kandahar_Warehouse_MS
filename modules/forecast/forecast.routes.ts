import { Router } from "express";
import { forecastController } from "./forecast.controller";

const router = Router();

router.get("/dashboard", forecastController.getDashboard);
router.get("/yearly", forecastController.getYearlyForecast);
router.get("/item/:itemId", forecastController.getItemForecast);

export default router;
