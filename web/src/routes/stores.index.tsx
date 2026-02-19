import { createFileRoute, Link } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { z } from "zod"
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  PlusSignIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { getApiStoresOptions } from "@/api/@tanstack/react-query.gen"
import { useDebounce } from "@/hooks/use-debounce"
import { useUpdateEffect } from "@/hooks/use-update-effect"
import { CatchBoundary } from "@/components/catch-boundary"
import { SortIcon } from "@/components/sort-icon"
import { TableSkeleton } from "@/components/page-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const SORTABLE_FIELDS = ["name", "location", "manager", "status"] as const
type SortField = (typeof SORTABLE_FIELDS)[number]

const STORE_STATUS_LABELS: Record<string, string> = {
  all: "All statuses",
  active: "Active",
  inactive: "Inactive",
}

const STORE_HEADERS: { label: string; field: SortField }[] = [
  { label: "Name", field: "name" },
  { label: "Location", field: "location" },
  { label: "Manager", field: "manager" },
  { label: "Status", field: "status" },
]

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.string().optional(),
})

export const Route = createFileRoute("/stores/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      getApiStoresOptions({ query: deps }),
    ),
  component: StoresPage,
  errorComponent: CatchBoundary,
  pendingComponent: TableSkeleton,
})


function StoresPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: result } = useSuspenseQuery(
    getApiStoresOptions({ query: search }),
  )

  const [searchText, setSearchText] = useState(search.q ?? "")
  const debouncedSearch = useDebounce(searchText)

  useUpdateEffect(() => {
    navigate({
      search: (prev) => ({
        ...prev,
        q: debouncedSearch || undefined,
        page: undefined,
      }),
    })
  }, [debouncedSearch])

  function toggleSort(field: SortField) {
    const [currentField, currentDir] = (search.sort ?? "").split(",")
    let next: string | undefined
    if (currentField !== field) {
      next = `${field},asc`
    } else if (currentDir === "asc") {
      next = `${field},desc`
    } else {
      next = undefined
    }
    navigate({ search: (prev) => ({ ...prev, sort: next, page: undefined }) })
  }

  return (
    <div className="flex flex-col gap-4 py-4 px-4 lg:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-sm">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="text-muted-foreground absolute left-2.5 top-2.5"
          />
          <Input
            placeholder="Search stores..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={search.status ?? "all"}
          onValueChange={(value) =>
            navigate({
              search: (prev) => ({
                ...prev,
                status:
                  value === "all"
                    ? undefined
                    : (value as "active" | "inactive"),
                page: undefined,
              }),
            })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue>
              {(value: string) => STORE_STATUS_LABELS[value] ?? "Status"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex w-full items-center justify-end sm:w-auto sm:ml-auto">
          <Button size="sm" render={<Link to="/stores/new" />}>
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            New Store
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              {STORE_HEADERS.map(({ label, field }) => (
                <TableHead
                  key={field}
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort(field)}
                >
                  <div className="flex items-center gap-1">
                    {label}
                    <SortIcon field={field} currentSort={search.sort} />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.data.length > 0 ? (
              result.data.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>
                    <Link
                      to="/stores/$storeId"
                      params={{ storeId: String(store.id) }}
                      className="font-medium text-primary hover:underline"
                    >
                      {store.name}
                    </Link>
                  </TableCell>
                  <TableCell>{store.location}</TableCell>
                  <TableCell>{store.manager}</TableCell>
                  <TableCell>
                    <Badge variant={store.status === "active" ? "success" : "neutral"}>
                      {store.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground">No stores found</p>
                    {(search.q || search.status) && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setSearchText("")
                          navigate({ search: {} })
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">
          {result.pagination.total} store(s) total
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm">
            Page {result.pagination.page} of {result.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={!result.pagination.hasPrev}
            onClick={() =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  page: result.pagination.page - 1,
                }),
              })
            }
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={!result.pagination.hasNext}
            onClick={() =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  page: result.pagination.page + 1,
                }),
              })
            }
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
