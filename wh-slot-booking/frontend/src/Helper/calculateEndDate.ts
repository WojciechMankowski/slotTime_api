export const calculateEndDate = (
  startDate: string,
  startTime: string,
  endTime: string,
): string => {
  const startDateTime = new Date(`${startDate}T${startTime}`);
  const endDateTime = new Date(`${startDate}T${endTime}`);
  if (endDateTime <= startDateTime) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }
  return endDateTime.toISOString().split("T")[0];
};