export function formatRupees(paise: number): string {
  return `Rs.${(paise / 100).toFixed(0)}`;
}
