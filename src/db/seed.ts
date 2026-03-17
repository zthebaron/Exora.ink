import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log("Seeding database...");

  // Insert product sizes
  await db.insert(schema.productSizes).values([
    { name: "Small", width: 22, height: 12, label: '22" \u00d7 12"', retailPrice: 12.99, wholesalePrice: 8.99, sortOrder: 1 },
    { name: "Medium", width: 22, height: 24, label: '22" \u00d7 24"', retailPrice: 19.99, wholesalePrice: 13.99, sortOrder: 2 },
    { name: "Large", width: 22, height: 36, label: '22" \u00d7 36"', retailPrice: 27.99, wholesalePrice: 18.99, sortOrder: 3 },
    { name: "XL", width: 22, height: 48, label: '22" \u00d7 48"', retailPrice: 34.99, wholesalePrice: 23.99, sortOrder: 4 },
    { name: "XXL", width: 22, height: 60, label: '22" \u00d7 60"', retailPrice: 42.99, wholesalePrice: 29.99, sortOrder: 5 },
    { name: "Max", width: 22, height: 72, label: '22" \u00d7 72"', retailPrice: 49.99, wholesalePrice: 34.99, sortOrder: 6 },
  ]);

  // Insert default assumptions
  await db.insert(schema.savedAssumptions).values({
    name: "Default DTF Assumptions",
    assumptions: {
      filmCostPerRoll: 85,
      rollWidth: 22,
      rollLength: 328,
      inkCostPerMl: 0.08,
      avgInkUsagePerSqFt: 12,
      powderCostPerLb: 12,
      avgPowderUsagePerSqFt: 8,
      laborCostPerHour: 22,
      avgProductionSpeedPerHour: 15,
      electricityCostPerMonth: 250,
      machineLeasePerMonth: 800,
      maintenanceReservePerMonth: 200,
      softwareCostPerMonth: 150,
      rentOverheadPerMonth: 1500,
      wastePercentage: 5,
      failedPrintPercentage: 3,
      packagingCostPerOrder: 1.50,
      shippingMaterialCostPerOrder: 2.00,
      desiredGrossMargin: 55,
      desiredNetMargin: 25,
      minimumOrderFee: 10,
      setupFee: 5,
      rushFeePercentage: 50,
      refundRemakeReservePercentage: 3,
      customerAcquisitionCost: 25,
      avgRepeatPurchaseFrequency: 4,
    },
    isDefault: true,
  });

  // Insert company settings
  await db.insert(schema.companySettings).values([
    {
      key: "brand",
      value: {
        name: "Exora.ink",
        tagline: "DTF Printing Intelligence Platform",
        email: "info@exora.ink",
        phone: "(555) 123-4567",
        website: "https://exora.ink",
      },
    },
    {
      key: "turnaround",
      value: {
        standard: "3-5 business days",
        rush: "1-2 business days",
        sameDay: "Same day (order by 10am)",
      },
    },
  ]);

  console.log("Seed complete!");
}

seed().catch(console.error);
