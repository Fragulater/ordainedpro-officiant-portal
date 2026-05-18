import { SquareClient, SquareEnvironment } from "square";

// Square client configuration
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

// Plan IDs - these should match your Square subscription plans
export const SQUARE_PLANS = {
  ASPIRANT: {
    id: process.env.SQUARE_ASPIRANT_PLAN_ID || "aspirant_monthly",
    name: "Aspirant",
    price: 1495, // $14.95 in cents
    interval: "MONTHLY" as const,
  },
  PROFESSIONAL: {
    id: process.env.SQUARE_PROFESSIONAL_PLAN_ID || "professional_monthly",
    name: "Professional",
    price: 2900, // $29.00 in cents
    interval: "MONTHLY" as const,
  },
  DATA_RETENTION: {
    id: process.env.SQUARE_DATA_RETENTION_PLAN_ID || "data_retention_monthly",
    name: "Data Retention",
    price: 100, // $1.00 in cents
    interval: "MONTHLY" as const,
  },
};

export type PlanType = keyof typeof SQUARE_PLANS;

// Helper to check if Square is configured
export function isSquareConfigured(): boolean {
  return !!(
    process.env.SQUARE_ACCESS_TOKEN &&
    process.env.SQUARE_LOCATION_ID
  );
}

// Export Square client for direct access
export { squareClient };
