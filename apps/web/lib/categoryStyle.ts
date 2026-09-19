import {
  Wheat,
  Flame,
  Cookie,
  Milk,
  CupSoda,
  Candy,
  SprayCan,
  ShoppingBasket,
  Package,
  type LucideIcon,
} from "lucide-react";

export type CategoryStyle = { icon: LucideIcon; bg: string; iconColor: string };

const STYLES: Record<string, CategoryStyle> = {
  "grocery-staples": { icon: Wheat, bg: "bg-amber-100", iconColor: "text-amber-700" },
  spices: { icon: Flame, bg: "bg-red-100", iconColor: "text-red-600" },
  snacks: { icon: Cookie, bg: "bg-orange-100", iconColor: "text-orange-600" },
  dairy: { icon: Milk, bg: "bg-blue-100", iconColor: "text-blue-600" },
  beverages: { icon: CupSoda, bg: "bg-sky-100", iconColor: "text-sky-600" },
  sweets: { icon: Candy, bg: "bg-pink-100", iconColor: "text-pink-600" },
  household: { icon: SprayCan, bg: "bg-teal-100", iconColor: "text-teal-600" },
};

const FALLBACKS: CategoryStyle[] = [
  { icon: ShoppingBasket, bg: "bg-amber-100", iconColor: "text-amber-700" },
  { icon: Package, bg: "bg-purple-100", iconColor: "text-purple-600" },
  { icon: ShoppingBasket, bg: "bg-lime-100", iconColor: "text-lime-600" },
];

export function getCategoryStyle(slug: string, index = 0): CategoryStyle {
  return STYLES[slug] ?? FALLBACKS[index % FALLBACKS.length];
}
