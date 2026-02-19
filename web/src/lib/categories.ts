export const CATEGORY_VALUES = [
  "electronics",
  "clothing",
  "food",
  "furniture",
  "tools",
  "other",
] as const

export type Category = (typeof CATEGORY_VALUES)[number]

export const CATEGORY_LABELS: Record<Category, string> = {
  electronics: "Electronics",
  clothing: "Clothing",
  food: "Food",
  furniture: "Furniture",
  tools: "Tools",
  other: "Other",
}
