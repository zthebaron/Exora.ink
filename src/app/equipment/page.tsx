"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { formatNumber } from "@/lib/formatters";
import {
  Printer,
  Flame,
  Monitor,
  Cpu,
  Clock,
  Zap,
  ExternalLink,
  BookOpen,
  Gauge,
  ArrowRight,
  Shirt,
  Layers,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Equipment data
// ---------------------------------------------------------------------------

const PRINTER = {
  name: "Mimaki TxF300-75",
  type: "DTF Printer",
  image: null,
  specs: [
    { label: "Printable Width", value: '30" / 762 mm (on 31" film)' },
    { label: "Media Width", value: 'Up to 31"' },
    { label: "Resolution", value: "Up to 1,440 dpi" },
    { label: "Print Speed", value: "Up to 35.5 sq ft/hr" },
    { label: "Ink Type", value: "PHT50 pigment ink (CMYK + White)" },
    { label: "Max Roll Weight", value: "99 lbs" },
    { label: "Print Heads", value: "Piezoelectric inkjet" },
  ],
  manuals: [
    {
      label: "Official Manual Downloads",
      url: "https://mimaki.com/product/inkjet/dtf/txf150-75/download-manual.html",
    },
    {
      label: "ManualsLib (5 Manuals)",
      url: "https://www.manualslib.com/products/Mimaki-Txf150-75-13266311.html",
    },
    {
      label: "Spec Sheet (PDF)",
      url: "https://www.mimakiusa.com/wp-content/uploads/2023/04/Mimaki-TxF150-75-Spec-Sheet.pdf",
    },
    {
      label: "Product Page",
      url: "https://www.mimakiusa.com/product/txf150-75/",
    },
  ],
};

const HEAT_PRESS = {
  name: "Hotronix Dual Air Fusion ProPlace IQ",
  type: "Heat Press",
  specs: [
    { label: "Platen Size", value: '16" x 20" Quick Change (x2)' },
    { label: "Heat Platen Thickness", value: '3/4" fast-recovering heater' },
    { label: "Temperature Range", value: "32\u00B0F \u2013 428\u00B0F" },
    { label: "Electrical", value: "120V or 240V options" },
    { label: "Air Compressor Req.", value: "Min 1 HP, 8 gal, 120 PSI, 3.8 CFM" },
    { label: "Controls", value: "Touchscreen with smart stylus" },
    { label: "Features", value: "Laser alignment, live digital readout, dual platens" },
  ],
  manuals: [
    {
      label: "Operator Manual (PDF)",
      url: "https://www.hotronix.com/images/uploaded/Manuals/DualAirFusion-PPIQ-OperatorManual-0325.pdf",
    },
    {
      label: "Stahls\u2019 Hosted Manual (PDF)",
      url: "https://assets.stahls.com/stahls/content/pdf/HeatPressManuals/Dual-Air-Fusion-IQ-Operators-Manual.pdf",
    },
    {
      label: "Product Page",
      url: "https://www.hotronix.com/hotronix-dual-air-fusion-iq-heat-press",
    },
  ],
};

const SOFTWARE = [
  {
    name: "CADlink Digital Factory",
    role: "RIP Software",
    description:
      "Raster Image Processor for DTF printing. Handles color management, white ink generation, gang sheet nesting, and print queue management.",
    links: [
      {
        label: "Support / Infosource",
        url: "https://www.cadlink.com/product-support/digitalfactory/",
      },
      {
        label: "Installation Instructions",
        url: "https://help.cadlink.com/website/digital_factory/en/bonus_documentation/installation_instructions.htm",
      },
      {
        label: "Downloads (Drivers & Updates)",
        url: "https://www.cadlink.com/downloads/",
      },
      {
        label: "Product Page",
        url: "https://www.cadlink.us/en-us/",
      },
    ],
  },
  {
    name: "Hotronix Fusion IQ",
    role: "Heat Press Controller",
    description:
      "Embedded touchscreen firmware for managing stored application presets, time/temp/pressure settings, usage tracking, and diagnostics.",
    links: [
      {
        label: "Fusion IQ Manual (PDF)",
        url: "https://www.hotronix.com/images/uploaded/Manuals/Fusion-IQ-Operators-Manual-2022.pdf",
      },
      {
        label: "Fusion IQ Manual \u2013 Stahls\u2019 (PDF)",
        url: "https://assets.stahls.com/stahls/content/pdf/HeatPressManuals/Hotronix-Fusion-IQ-Operators-Manual.pdf",
      },
      {
        label: "Hotronix Support Portal",
        url: "https://www.hotronix.com/support",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Production constants
// ---------------------------------------------------------------------------

const PRINTER_SQFT_PER_HOUR = 35.5;
const PRESS_GARMENTS_PER_HOUR = 125; // avg of 100-150
const AVG_TRANSFER_SQFT = 1.1; // ~12"x13" average transfer area

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EquipmentPage() {
  const [shiftHours, setShiftHours] = useState(8);
  const [designCoverage, setDesignCoverage] = useState(75); // % of sheet used
  const [resolution, setResolution] = useState(75); // quality slider (affects speed)

  const production = useMemo(() => {
    const speedFactor = 1.5 - resolution / 100; // higher quality = slower
    const effectiveSqFtPerHour = PRINTER_SQFT_PER_HOUR * speedFactor;
    const coverageFactor = designCoverage / 100;

    const totalPrintSqFt = effectiveSqFtPerHour * shiftHours;
    const transfersProduced = Math.floor(
      (totalPrintSqFt * coverageFactor) / AVG_TRANSFER_SQFT
    );
    const pressCapacity = Math.floor(PRESS_GARMENTS_PER_HOUR * shiftHours);
    const garmentsFinished = Math.min(transfersProduced, pressCapacity);
    const bottleneck =
      transfersProduced <= pressCapacity ? "Printing" : "Pressing";

    return {
      effectiveSqFtPerHour: Math.round(effectiveSqFtPerHour * 10) / 10,
      totalPrintSqFt: Math.round(totalPrintSqFt),
      transfersProduced,
      pressCapacity,
      garmentsFinished,
      bottleneck,
      printerUtilization: Math.min(
        100,
        Math.round((transfersProduced / pressCapacity) * 100)
      ),
      pressUtilization: Math.min(
        100,
        Math.round((garmentsFinished / pressCapacity) * 100)
      ),
    };
  }, [shiftHours, designCoverage, resolution]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page Header */}
      <h1 className="text-3xl font-bold tracking-tight">
        Equipment &amp; Production
      </h1>
      <p className="mt-2 text-muted-foreground">
        In-house DTF printing and heat press equipment with production capacity
        estimates.
      </p>

      {/* ------------------------------------------------------------------ */}
      {/* Equipment Cards */}
      {/* ------------------------------------------------------------------ */}

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        {/* Printer Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Printer className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{PRINTER.name}</CardTitle>
                <CardDescription>{PRINTER.type}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {PRINTER.specs.map((spec) => (
                    <tr key={spec.label} className="border-b border-border">
                      <td className="py-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">
                        {spec.label}
                      </td>
                      <td className="py-2">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="h-4 w-4 text-primary" />
                Manuals &amp; Documentation
              </h4>
              <ul className="space-y-1.5">
                {PRINTER.manuals.map((m) => (
                  <li key={m.label}>
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {m.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Heat Press Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{HEAT_PRESS.name}</CardTitle>
                <CardDescription>{HEAT_PRESS.type}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {HEAT_PRESS.specs.map((spec) => (
                    <tr key={spec.label} className="border-b border-border">
                      <td className="py-2 pr-4 font-medium text-muted-foreground whitespace-nowrap">
                        {spec.label}
                      </td>
                      <td className="py-2">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="h-4 w-4 text-primary" />
                Manuals &amp; Documentation
              </h4>
              <ul className="space-y-1.5">
                {HEAT_PRESS.manuals.map((m) => (
                  <li key={m.label}>
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {m.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Software */}
      {/* ------------------------------------------------------------------ */}

      <section className="mt-10">
        <h2 className="text-xl font-bold">Software</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          RIP and heat press controller software powering the production
          workflow.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {SOFTWARE.map((sw) => (
            <Card key={sw.name}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                    {sw.role === "RIP Software" ? (
                      <Monitor className="h-5 w-5" />
                    ) : (
                      <Cpu className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{sw.name}</CardTitle>
                    <CardDescription>{sw.role}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {sw.description}
                </p>
                <ul className="space-y-1.5">
                  {sw.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Production Estimates */}
      {/* ------------------------------------------------------------------ */}

      <section className="mt-12">
        <h2 className="text-xl font-bold">Production Estimates</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Adjust shift length, design coverage, and print quality to see
          real-time throughput estimates.
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          {/* Controls */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Production Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Slider
                label="Shift Length (hours)"
                value={shiftHours}
                onChange={setShiftHours}
                min={1}
                max={12}
                step={1}
                formatValue={(v) => `${v}h`}
              />
              <Slider
                label="Design Coverage"
                value={designCoverage}
                onChange={setDesignCoverage}
                min={30}
                max={100}
                step={5}
                formatValue={(v) => `${v}%`}
              />
              <Slider
                label="Print Quality"
                value={resolution}
                onChange={setResolution}
                min={50}
                max={100}
                step={5}
                formatValue={(v) =>
                  v >= 90 ? "Max" : v >= 75 ? "High" : v >= 60 ? "Standard" : "Draft"
                }
              />

              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                Higher quality reduces print speed. Coverage affects how many
                individual transfers fit per square foot of printed film.
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6 lg:col-span-2">
            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Gauge className="h-4 w-4" />
                    Print Speed
                  </div>
                  <p className="mt-1 text-2xl font-bold">
                    {production.effectiveSqFtPerHour}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      sq ft/hr
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Layers className="h-4 w-4" />
                    Transfers Printed
                  </div>
                  <p className="mt-1 text-2xl font-bold">
                    {formatNumber(production.transfersProduced)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      / shift
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shirt className="h-4 w-4" />
                    Garments Finished
                  </div>
                  <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatNumber(production.garmentsFinished)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      / shift
                    </span>
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Pipeline Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Production Pipeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  {/* Printing Stage */}
                  <div className="flex-1 rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Printer className="h-4 w-4 text-primary" />
                        Printing
                      </div>
                      {production.bottleneck === "Printing" && (
                        <Badge className="bg-amber-500 text-white text-xs">
                          Bottleneck
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-xl font-bold">
                      {formatNumber(production.transfersProduced)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      transfers / shift
                    </p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Total film printed</span>
                        <span>{formatNumber(production.totalPrintSqFt)} sq ft</span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-5 w-5 text-muted-foreground sm:rotate-0 rotate-90" />
                  </div>

                  {/* Pressing Stage */}
                  <div className="flex-1 rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Flame className="h-4 w-4 text-primary" />
                        Heat Pressing
                      </div>
                      {production.bottleneck === "Pressing" && (
                        <Badge className="bg-amber-500 text-white text-xs">
                          Bottleneck
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-xl font-bold">
                      {formatNumber(production.pressCapacity)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      garments capacity / shift
                    </p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Utilization</span>
                        <span>{production.pressUtilization}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-5 w-5 text-muted-foreground sm:rotate-0 rotate-90" />
                  </div>

                  {/* Output */}
                  <div className="flex-1 rounded-lg border-2 border-emerald-500/30 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Shirt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      Finished Output
                    </div>
                    <p className="mt-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatNumber(production.garmentsFinished)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      garments / shift
                    </p>
                  </div>
                </div>

                {/* Press Cycle Detail */}
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Press Cycle Time
                    </div>
                    <p className="mt-1 text-sm font-semibold">10\u201315 seconds</p>
                    <p className="text-xs text-muted-foreground">
                      at 300\u2013325\u00B0F
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Zap className="h-3.5 w-3.5" />
                      Dual Platen Advantage
                    </div>
                    <p className="mt-1 text-sm font-semibold">2x throughput</p>
                    <p className="text-xs text-muted-foreground">
                      Load one side while pressing the other
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Gauge className="h-3.5 w-3.5" />
                      Daily Capacity ({shiftHours}h)
                    </div>
                    <p className="mt-1 text-sm font-semibold">
                      {formatNumber(production.garmentsFinished)} garments
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Bottleneck: {production.bottleneck}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shift Projections Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shift Projections</CardTitle>
                <CardDescription>
                  Estimated output at current settings across different shift lengths
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="py-2 text-left font-medium text-muted-foreground">
                          Shift
                        </th>
                        <th className="py-2 text-right font-medium text-muted-foreground">
                          Film Printed
                        </th>
                        <th className="py-2 text-right font-medium text-muted-foreground">
                          Transfers
                        </th>
                        <th className="py-2 text-right font-medium text-muted-foreground">
                          Press Capacity
                        </th>
                        <th className="py-2 text-right font-medium text-muted-foreground">
                          Garments Out
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[4, 6, 8, 10, 12].map((hours) => {
                        const speedFactor = 1.5 - resolution / 100;
                        const sqft =
                          PRINTER_SQFT_PER_HOUR * speedFactor * hours;
                        const transfers = Math.floor(
                          (sqft * (designCoverage / 100)) / AVG_TRANSFER_SQFT
                        );
                        const press = Math.floor(
                          PRESS_GARMENTS_PER_HOUR * hours
                        );
                        const output = Math.min(transfers, press);
                        const isCurrentShift = hours === shiftHours;
                        return (
                          <tr
                            key={hours}
                            className={`border-b border-border ${
                              isCurrentShift
                                ? "bg-primary/5 font-semibold"
                                : ""
                            }`}
                          >
                            <td className="py-2">
                              {hours}h shift
                              {isCurrentShift && (
                                <Badge className="ml-2 bg-primary text-primary-foreground text-xs">
                                  Current
                                </Badge>
                              )}
                            </td>
                            <td className="py-2 text-right">
                              {formatNumber(Math.round(sqft))} sq ft
                            </td>
                            <td className="py-2 text-right">
                              {formatNumber(transfers)}
                            </td>
                            <td className="py-2 text-right">
                              {formatNumber(press)}
                            </td>
                            <td className="py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatNumber(output)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
