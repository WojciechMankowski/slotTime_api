import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import ReportDailyChart from "../../components/reports/ReportDailyChart";
import type { ReportDayRow } from "../../hooks/useReports";

const makeRow = (overrides: Partial<ReportDayRow> = {}): ReportDayRow => ({
  date: "2025-06-01",
  total: 10,
  available: 3,
  booked: 2,
  approved_waiting_details: 1,
  reserved_confirmed: 1,
  completed: 2,
  cancelled: 1,
  cancel_pending: 0,
  inbound: 5,
  outbound: 3,
  any: 2,
  utilization_pct: 70,
  ...overrides,
});

describe("ReportDailyChart", () => {
  it("returns null when rows is empty", () => {
    const { container } = render(<ReportDailyChart rows={[]} lang="pl" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders an SVG element", () => {
    const { container } = render(<ReportDailyChart rows={[makeRow()]} lang="pl" />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("shows total count in SVG text for each bar", () => {
    render(<ReportDailyChart rows={[makeRow({ total: 10 })]} lang="pl" />);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("shows date label in MM-DD format", () => {
    render(<ReportDailyChart rows={[makeRow({ date: "2025-06-15" })]} lang="pl" />);
    expect(screen.getByText("06-15")).toBeInTheDocument();
  });

  it("shows utilization percentage", () => {
    render(<ReportDailyChart rows={[makeRow({ utilization_pct: 70 })]} lang="pl" />);
    expect(screen.getByText("70%")).toBeInTheDocument();
  });

  it("does not show total label for 0-total rows", () => {
    const { container } = render(
      <ReportDailyChart rows={[makeRow({ total: 0 })]} lang="pl" />
    );
    const svg = container.querySelector("svg")!;
    const texts = Array.from(svg.querySelectorAll("text")).map(t => t.textContent);
    expect(texts).not.toContain("0");
  });

  it("renders a bar for each row", () => {
    const rows = [
      makeRow({ date: "2025-06-01" }),
      makeRow({ date: "2025-06-02" }),
      makeRow({ date: "2025-06-03" }),
    ];
    const { container } = render(<ReportDailyChart rows={rows} lang="pl" />);
    // each row produces a <g> group
    const groups = container.querySelectorAll("g");
    expect(groups.length).toBe(3);
  });

  it("renders legend items", () => {
    render(<ReportDailyChart rows={[makeRow()]} lang="pl" />);
    // Legend shows translated labels - check for any container div with legend
    const { container } = render(<ReportDailyChart rows={[makeRow()]} lang="en" />);
    expect(container.querySelector(".flex.flex-wrap")).toBeTruthy();
  });
});
