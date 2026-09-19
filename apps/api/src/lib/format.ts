export function formatKg(kg: number): string {
  return kg < 1 ? `${Math.round(kg * 1000)}g` : `${kg}kg`;
}
