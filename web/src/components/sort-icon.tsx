import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowUpDownIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons"

export function SortIcon({
  field,
  currentSort,
}: {
  field: string
  currentSort: string | undefined
}) {
  if (!currentSort)
    return (
      <HugeiconsIcon
        icon={ArrowUpDownIcon}
        size={14}
        className="text-muted-foreground"
      />
    )
  const [sortField, sortDir] = currentSort.split(",")
  if (sortField !== field)
    return (
      <HugeiconsIcon
        icon={ArrowUpDownIcon}
        size={14}
        className="text-muted-foreground"
      />
    )
  return sortDir === "asc" ? (
    <HugeiconsIcon icon={ArrowUp01Icon} size={14} />
  ) : (
    <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
  )
}
