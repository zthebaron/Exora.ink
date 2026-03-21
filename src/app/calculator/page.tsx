"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GangSheetCalculator } from "./gang-sheet-calculator";
import { PressOnlyCalculator } from "./press-only-calculator";
import { FullServiceCalculator } from "./full-service-calculator";

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pricing Calculators
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Gang sheet profitability, press-only service, and full-service custom apparel pricing.
          </p>
        </div>

        <Tabs defaultValue="gang-sheets">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="gang-sheets">Gang Sheet Pricing</TabsTrigger>
            <TabsTrigger value="press-only">Press Only</TabsTrigger>
            <TabsTrigger value="full-service">Full Service</TabsTrigger>
          </TabsList>

          <TabsContent value="gang-sheets">
            <GangSheetCalculator />
          </TabsContent>

          <TabsContent value="press-only">
            <PressOnlyCalculator />
          </TabsContent>

          <TabsContent value="full-service">
            <FullServiceCalculator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
