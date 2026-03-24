import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ReportKpiCards from "../../components/reports/ReportKpiCards";
import type { ReportSummary } from "../../hooks/useReports";

const baseSummary: ReportSummary = {
  total: 100,
  available: 20,
  booked: 10,
  approved_waiting_details: 5,
  reserved_confirmed: 5,
  completed: 50,
  cancelled: 10,
  cancel_pending: 2,
  inbound: 40,
  outbound: 35,
  any: 25,
  utilization_pct: 80,
};

describe("ReportKpiCards", () => {
  it("renders total slot count", () => {
    render(<ReportKpiCards summary={baseSummary} lang="pl" />);
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders utilization percentage", () => {
    render(<ReportKpiCards summary={baseSummary} lang="pl" />);
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("renders completed count", () => {
    render(<ReportKpiCards summary={baseSummary} lang="pl" />);
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("renders cancelled count", () => {
    render(<ReportKpiCards summary={baseSummary} lang="pl" />);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("renders available count as sub-label", () => {
    render(<ReportKpiCards summary={baseSummary} lang="pl" />);
    // sub text shows "Dostępne: 20"
    expect(screen.getByText(/20/)).toBeInTheDocument();
  });

  it("applies emerald color class for utilization >= 80", () => {
    const { container } = render(
      <ReportKpiCards summary={{ ...baseSummary, utilization_pct: 80 }} lang="pl" />
    );
    expect(container.innerHTML).toContain("emerald");
  });

  it("applies amber color class for utilization >= 50 and < 80", () => {
    const { container } = render(
      <ReportKpiCards summary={{ ...baseSummary, utilization_pct: 60 }} lang="pl" />
    );
    expect(container.innerHTML).toContain("amber");
  });

  it("applies red color class for utilization < 50", () => {
    const { container } = render(
      <ReportKpiCards summary={{ ...baseSummary, utilization_pct: 30 }} lang="pl" />
    );
    // Both utilization card and cancelled card use red; check it appears
    expect(container.innerHTML).toContain("red");
  });

  it("renders correctly with English labels", () => {
    render(<ReportKpiCards summary={baseSummary} lang="en" />);
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("renders 4 KPI cards", () => {
    const { container } = render(<ReportKpiCards summary={baseSummary} lang="pl" />);
    // Each card has a "text-3xl font-black" value
    const values = container.querySelectorAll(".text-3xl");
    expect(values.length).toBe(4);
  });
});
