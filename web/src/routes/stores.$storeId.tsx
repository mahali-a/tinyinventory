import { createFileRoute, Link } from "@tanstack/react-router"
import { useMemo } from "react"
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import {
  getApiStoresByIdOptions,
  getApiStoresByIdQueryKey,
  getApiStoresQueryKey,
  getApiProductsOptions,
} from "@/api/@tanstack/react-query.gen"
import { deleteApiStoresById, patchApiStoresById } from "@/api"
import type { PatchApiStoresByIdData } from "@/api"
import { toast } from "sonner"
import { CatchBoundary } from "@/components/catch-boundary"
import { DetailSkeleton } from "@/components/page-skeleton"
import { FieldError } from "@/components/field-error"
import { getApiErrorMessage } from "@/lib/api-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Package01Icon,
  AlertDiamondIcon,
  CheckmarkCircle02Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { IconArrowLeft, IconTrash } from "@tabler/icons-react"
import { useBack } from "@/hooks/use-back"
import { Switch } from "@/components/ui/switch"

const updateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  manager: z.string().min(1, "Manager is required"),
})

export const Route = createFileRoute("/stores/$storeId")({
  loader: ({ context, params }) => {
    const id = Number(params.storeId)
    return Promise.all([
      context.queryClient.ensureQueryData(
        getApiStoresByIdOptions({ path: { id } }),
      ),
      context.queryClient.ensureQueryData(
        getApiProductsOptions({ query: { storeId: id, limit: 50 } }),
      ),
    ])
  },
  component: StoreDetailPage,
  errorComponent: CatchBoundary,
  pendingComponent: DetailSkeleton,
})

function StoreDetailPage() {
  const { storeId } = Route.useParams()
  const navigate = Route.useNavigate()
  const goBack = useBack("/stores")
  const queryClient = useQueryClient()
  const id = Number(storeId)

  const { data: storeResult } = useSuspenseQuery(
    getApiStoresByIdOptions({ path: { id } }),
  )
  const { data: productsResult } = useSuspenseQuery(
    getApiProductsOptions({ query: { storeId: id, limit: 50 } }),
  )

  const store = storeResult.data

  const summaryCards = useMemo(() => [
    {
      label: "Total Products",
      value: store.productSummary.total,
      limit: "in this store",
      percentage: 100,
      icon: <HugeiconsIcon icon={Package01Icon} strokeWidth={1.5} />,
      warning: false,
    },
    {
      label: "Low Stock",
      value: store.productSummary.lowStock,
      limit: `of ${store.productSummary.total} products`,
      percentage: store.productSummary.total > 0
        ? (store.productSummary.lowStock / store.productSummary.total) * 100
        : 0,
      icon: <HugeiconsIcon icon={AlertDiamondIcon} strokeWidth={1.5} />,
      warning: store.productSummary.lowStock > 0,
    },
    {
      label: "Out of Stock",
      value: store.productSummary.outOfStock,
      limit: `of ${store.productSummary.total} products`,
      percentage: store.productSummary.total > 0
        ? (store.productSummary.outOfStock / store.productSummary.total) * 100
        : 0,
      icon: <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={1.5} />,
      warning: store.productSummary.outOfStock > 0,
    },
  ], [store.productSummary])

  const updateMutation = useMutation({
    mutationFn: (body: PatchApiStoresByIdData["body"]) =>
      patchApiStoresById({ path: { id }, body, throwOnError: true }),
    onMutate: async (body) => {
      await queryClient.cancelQueries({
        queryKey: getApiStoresByIdQueryKey({ path: { id } }),
      })
      const previous = queryClient.getQueryData(
        getApiStoresByIdQueryKey({ path: { id } }),
      )
      queryClient.setQueryData(
        getApiStoresByIdQueryKey({ path: { id } }),
        (old: typeof storeResult | undefined) =>
          old ? { data: { ...old.data, ...body } } : old,
      )
      return { previous }
    },
    onError: (err, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          getApiStoresByIdQueryKey({ path: { id } }),
          context.previous,
        )
      }
      toast.error(getApiErrorMessage(err, "Failed to update store"))
    },
    onSuccess: () => {
      toast.success("Store updated")
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getApiStoresByIdQueryKey({ path: { id } }),
      })
      queryClient.invalidateQueries({
        queryKey: getApiStoresQueryKey(),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () =>
      deleteApiStoresById({ path: { id }, throwOnError: true }),
    onSuccess: () => {
      toast.success("Store deleted")
      navigate({ to: "/stores" })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to delete store")),
  })

  const form = useForm({
    defaultValues: {
      name: store.name,
      location: store.location,
      manager: store.manager,
    },
    validators: { onSubmit: updateSchema },
    onSubmit: ({ value }) => updateMutation.mutate(value),
  })

  return (
    <div className="flex flex-col gap-4 py-4 px-4 lg:px-6">
      <div className="flex min-h-10 items-center gap-2">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <IconArrowLeft />
        </Button>
        <h2 className="text-lg font-semibold">{store.name}</h2>
        <div className="ml-auto flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <Switch
              checked={store.status === "active"}
              onCheckedChange={(checked) =>
                updateMutation.mutate({ status: checked ? "active" : "inactive" })
              }
              disabled={updateMutation.isPending}
            />
            <span className="text-muted-foreground">
              {store.status === "active" ? "Active" : "Inactive"}
            </span>
          </label>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            <IconTrash className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((item) => (
          <Card key={item.label} className="py-4">
            <CardContent>
              <dt className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                {item.label}
                {item.icon}
              </dt>
              <dd
                className={`mt-1 text-2xl font-semibold tabular-nums ${
                  item.warning ? "text-orange-500 dark:text-orange-400" : "text-foreground"
                }`}
              >
                {item.value}
              </dd>
              <Progress value={item.percentage} className="mt-4 h-1.5" />
              <dd className="mt-2 flex items-center justify-between text-sm">
                <span className="text-primary tabular-nums">
                  {item.percentage.toFixed(0)}%
                </span>
                <span className="text-muted-foreground">{item.limit}</span>
              </dd>
            </CardContent>
          </Card>
        ))}
      </dl>

      <div className="grid gap-4 @xl/main:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold">Edit Store</h3>
          <Card>
          <CardContent className="pt-6">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
              }}
              className="grid gap-4"
            >
              <form.Field
                name="name"
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Name</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldError field={field} />
                  </div>
                )}
              />
              <form.Field
                name="location"
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Location</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldError field={field} />
                  </div>
                )}
              />
              <form.Field
                name="manager"
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Manager</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldError field={field} />
                  </div>
                )}
              />

              <form.Subscribe
                selector={(state) => state.isSubmitting}
                children={(isSubmitting) => (
                  <Button
                    type="submit"
                    className="w-fit"
                    disabled={isSubmitting || updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                )}
              />
            </form>
          </CardContent>
        </Card>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">Products</h3>
          <div className="flex items-center gap-2">
            <Link
              to="/products"
              search={{ storeId: id }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
            <Button size="sm" render={<Link to="/products/new" search={{ storeId: id }} />}>
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              Add Product
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsResult.data.length > 0 ? (
                productsResult.data.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Link
                        to="/products/$productId"
                        params={{ productId: String(product.id) }}
                        className="font-medium text-primary hover:underline"
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.sku}
                    </TableCell>
                    <TableCell className="text-sm capitalize text-muted-foreground">
                      {product.category}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      ${product.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {product.quantity}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.status === "in_stock"
                            ? "success"
                            : product.status === "low_stock"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {product.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <p className="text-muted-foreground">
                      No products in this store
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}




