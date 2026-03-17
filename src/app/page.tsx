import Link from "next/link";
import {
  Calculator,
  BarChart3,
  LineChart,
  FileText,
  Activity,
  Users,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

const features = [
  {
    icon: Calculator,
    title: "Profitability Calculator",
    description:
      "Full cost engine with adjustable assumptions and real-time margin analysis.",
  },
  {
    icon: BarChart3,
    title: "Scenario Analysis",
    description:
      "Test low, medium, and high volume scenarios with side-by-side comparison.",
  },
  {
    icon: LineChart,
    title: "Executive Dashboard",
    description:
      "Charts and graphs for revenue, margins, break-even, and forecasting.",
  },
  {
    icon: FileText,
    title: "Price Sheet Generator",
    description:
      "Create customer-ready retail and wholesale price sheets.",
  },
  {
    icon: Activity,
    title: "Sensitivity Analysis",
    description:
      "See how changes in price, waste, or labor impact your bottom line.",
  },
  {
    icon: Users,
    title: "Customer Lifetime Value",
    description:
      "Estimate repeat purchase value, payback period, and lifetime profit.",
  },
];

const steps = [
  {
    number: "1",
    title: "Enter Your Assumptions",
    description:
      "Input your real costs — film, ink, powder, labor, overhead.",
  },
  {
    number: "2",
    title: "Analyze & Compare",
    description:
      "Run scenarios, test pricing strategies, find your break-even point.",
  },
  {
    number: "3",
    title: "Generate & Export",
    description:
      "Create polished price sheets and reports ready for customers.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Exora.ink
          </h1>
          <p className="mt-4 text-xl font-medium text-primary sm:text-2xl">
            DTF Printing Intelligence Platform
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Understand, test, and optimize the profitability of your DTF
            printing operation with precision tools built for modern print
            businesses.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/calculator"
              className="bg-primary text-primary-foreground rounded-lg px-6 py-3 font-semibold transition-opacity hover:opacity-90"
            >
              Launch Calculator
            </Link>
            <Link
              href="/dashboard"
              className="border border-border rounded-lg px-6 py-3 font-semibold text-foreground transition-colors hover:bg-muted"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to run a profitable DTF operation
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            Purpose-built tools that give you clarity on costs, margins, and
            growth potential.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            Three simple steps to clarity on your DTF profitability.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                  {step.number}
                </div>
                <h3 className="mt-6 text-xl font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-3 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to optimize your DTF margins?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Start with the profitability calculator and see exactly where your
            money goes.
          </p>
          <div className="mt-8">
            <Link
              href="/calculator"
              className="inline-block bg-primary text-primary-foreground rounded-lg px-8 py-3 font-semibold transition-opacity hover:opacity-90"
            >
              Launch Calculator
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
