import { createFileRoute, Link } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { z } from "zod"
import { useState, useMemo } from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  LayoutTable01Icon,
  PlusSignIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { getApiProductsOptions, getApiStoresOptions } from "@/api/@tanstack/react-query.gen"
import type { GetApiProductsResponse } from "@/api"
import { useDebounce } from "@/hooks/use-debounce"
import { useUpdateEffect } from "@/hooks/use-update-effect"
import { CATEGORY_VALUES, CATEGORY_LABELS } from "@/lib/categories"
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const SORTABLE_FIELDS = ["name", "sku", "category", "price", "quantity", "status", "storeName"] as const
type SortField = (typeof SORTABLE_FIELDS)[number]

const PRODUCT_STATUS_LABELS: Record<string, string> = {
  all: "All statuses",
  in_stock: "In Stock",
  low_stock: "Low Stock",
  out_of_stock: "Out of Stock",
}

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.enum(CATEGORY_VALUES).optional(),
  status: z.enum(["in_stock", "low_stock", "out_of_stock"]).optional(),
  storeId: z.number().int().positive().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sort: z.string().optional(),
})

export const Route = createFileRoute("/products/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getApiProductsOptions({ query: deps })),
      context.queryClient.ensureQueryData(getApiStoresOptions({ query: { limit: 100 } })),
    ]),
  component: ProductsPage,
  errorComponent: CatchBoundary,
  pendingComponent: TableSkeleton,
})

type Product = GetApiProductsResponse["data"][number]

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        to="/products/$productId"
        params={{ productId: String(row.original.id) }}
        className="font-medium text-primary hover:underline"
      >
        {row.original.name}
      </Link>
    ),
    enableHiding: false,
    enableSorting: true,
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.sku}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <span className="text-sm capitalize text-muted-foreground">{row.original.category}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => (
      <span className="tabular-nums">${row.original.price.toFixed(2)}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "quantity",
    header: "Qty",
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.quantity}</span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.status === "in_stock"
            ? "success"
            : row.original.status === "low_stock"
              ? "warning"
              : "danger"
        }
      >
        {row.original.status.replace(/_/g, " ")}
      </Badge>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "storeName",
    header: "Store",
    enableSorting: true,
  },
]

function ProductsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: result } = useSuspenseQuery(
    getApiProductsOptions({ query: search }),
  )
  const { data: storesResult } = useSuspenseQuery(
    getApiStoresOptions({ query: { limit: 100 } }),
  )

  const [searchText, setSearchText] = useState(search.q ?? "")
  const debouncedSearch = useDebounce(searchText)
  const [minPriceText, setMinPriceText] = useState(search.minPrice?.toString() ?? "")
  const [maxPriceText, setMaxPriceText] = useState(search.maxPrice?.toString() ?? "")
  const debouncedMinPrice = useDebounce(minPriceText)
  const debouncedMaxPrice = useDebounce(maxPriceText)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  useUpdateEffect(() => {
    navigate({
      search: (prev) => ({
        ...prev,
        q: debouncedSearch || undefined,
        page: undefined,
      }),
    })
  }, [debouncedSearch])

  useUpdateEffect(() => {
    navigate({
      search: (prev) => ({
        ...prev,
        minPrice: debouncedMinPrice ? Number(debouncedMinPrice) : undefined,
        page: undefined,
      }),
    })
  }, [debouncedMinPrice])

  useUpdateEffect(() => {
    navigate({
      search: (prev) => ({
        ...prev,
        maxPrice: debouncedMaxPrice ? Number(debouncedMaxPrice) : undefined,
        page: undefined,
      }),
    })
  }, [debouncedMaxPrice])

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

  const sortingState = useMemo<SortingState>(() => {
    if (!search.sort) return []
    const [id, dir] = search.sort.split(",")
    return [{ id, desc: dir === "desc" }]
  }, [search.sort])

  const table = useReactTable({
    data: result.data,
    columns,
    state: { sorting: sortingState, columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  })

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
            placeholder="Search products..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={search.category ?? "all"}
          onValueChange={(value) =>
            navigate({
              search: (prev) => ({
                ...prev,
                category:
                  value === "all"
                    ? undefined
                    : (value as typeof search.category),
                page: undefined,
              }),
            })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue>
              {(value: string) =>
                value === "all"
                  ? "All categories"
                  : (CATEGORY_LABELS[value as keyof typeof CATEGORY_LABELS] ?? "Category")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORY_VALUES.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={search.status ?? "all"}
          onValueChange={(value) =>
            navigate({
              search: (prev) => ({
                ...prev,
                status:
                  value === "all"
                    ? undefined
                    : (value as typeof search.status),
                page: undefined,
              }),
            })
          }
        >
          <SelectTrigger className="w-36">
            <SelectValue>
              {(value: string) => PRODUCT_STATUS_LABELS[value] ?? "Status"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={search.storeId ? String(search.storeId) : "all"}
          onValueChange={(value) =>
            navigate({
              search: (prev) => ({
                ...prev,
                storeId: value === "all" ? undefined : Number(value),
                page: undefined,
              }),
            })
          }
        >
          <SelectTrigger className="min-w-32 max-w-52 truncate">
            <SelectValue>
              {(value: string) =>
                value === "all"
                  ? "All stores"
                  : (storesResult.data.find((s) => String(s.id) === value)?.name ?? "Store")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="w-auto min-w-(--anchor-width)">
            <SelectItem value="all">All stores</SelectItem>
            {storesResult.data.map((store) => (
              <SelectItem key={store.id} value={String(store.id)}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          placeholder="Min price"
          className="w-28"
          value={minPriceText}
          onChange={(e) => setMinPriceText(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Max price"
          className="w-28"
          value={maxPriceText}
          onChange={(e) => setMaxPriceText(e.target.value)}
        />
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:ml-auto">
          <Button size="sm" render={<Link to="/products/new" />}>
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            New Product
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  <HugeiconsIcon icon={LayoutTable01Icon} size={16} />
                  Columns
                </Button>
              }
            />
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize"
                    checked={col.getIsVisible()}
                    onCheckedChange={(value) => col.toggleVisibility(!!value)}
                  >
                    {col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const field = header.column.id as SortField
                  const isSortable = SORTABLE_FIELDS.includes(field)
                  return (
                    <TableHead
                      key={header.id}
                      className={isSortable ? "cursor-pointer select-none" : ""}
                      onClick={isSortable ? () => toggleSort(field) : undefined}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {isSortable && <SortIcon field={field} currentSort={search.sort} />}
                      </div>
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground">No products found</p>
                    {(search.q ||
                      search.category ||
                      search.status ||
                      search.storeId ||
                      search.minPrice ||
                      search.maxPrice) && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setSearchText("")
                          setMinPriceText("")
                          setMaxPriceText("")
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
          {result.pagination.total} product(s) total
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
