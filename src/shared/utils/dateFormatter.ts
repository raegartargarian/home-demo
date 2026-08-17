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
