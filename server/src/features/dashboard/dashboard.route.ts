import { FastifyInstance } from "fastify";
import { getDashboardMetrics } from "./dashboard.service";
import { dashboardMetricsSchema } from "./dashboard.schema";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get(
    "/dashboard/metrics",
    { schema: dashboardMetricsSchema },
    async () => {
      return { data: getDashboardMetrics() };
    }
  );
}
