export interface DayReport {
  date: string;
  requested: number;
  generated: number;
  skipped_due_to_capacity: number;
  capacity: number | null;
}