/**
 * Format cents to euros string (e.g., 2500 -> "\u20AC25")
 */
export function formatEuros(cents: number): string {
  const euros = cents / 100;
  // Use manual formatting to avoid hydration mismatches between Node.js and browser toLocaleString
  if (euros % 1 === 0) {
    const formatted = Math.round(euros).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `\u20AC${formatted}`;
  }
  const fixed = euros.toFixed(2).replace(".", ",");
  const [intPart, decPart] = fixed.split(",");
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `\u20AC${formattedInt},${decPart}`;
}

/**
 * Format a date string to a readable Dutch format
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "Z"); // treat as UTC
  return date.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
