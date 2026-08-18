/**
 * A span of dates: "19 February 2024 – 28 June 2024", collapsing to a single
 * date when something began and ended on the same day.
 */
export function formatDateSpan(
  from: Date | null,
  to: Date | null
): string | null {
  if (!from || !to) return null;
  return from.getTime() === to.getTime()
    ? formatDate(from)
    : `${formatDate(from)} – ${formatDate(to)}`;
}

export function formatDate(date: Date | string | number): string {
  if (date === "") {
    return "";
  }
  const dateObject = new Date(date);

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObject);
}
