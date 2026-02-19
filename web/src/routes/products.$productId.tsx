import { createFileRoute } from "@tanstack/react-router"
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import {
  getApiProductsByIdOptions,
  getApiProductsByIdQueryKey,
  getApiProductsQueryKey,
} from "@/api/@tanstack/react-query.gen"
import { deleteApiProductsById, patchApiProductsById } from "@/api"
import type { PatchApiProductsByIdData } from "@/api"
import { toast } from "sonner"
import { CatchBoundary } from "@/components/catch-boundary"
import { DetailSkeleton } from "@/components/page-skeleton"
import { FieldError } from "@/components/field-error"
import { CATEGORY_VALUES, CATEGORY_LABELS } from "@/lib/categories"
import { getApiErrorMessage } from "@/lib/api-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconArrowLeft, IconTrash } from "@tabler/icons-react"
import { useBack } from "@/hooks/use-back"

const updateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().min(0, "Price must be positive"),
  quantity: z.number().int().min(0, "Quantity must be non-negative"),
  minStock: z.number().int().min(0, "Min stock must be non-negative"),
  category: z.enum(CATEGORY_VALUES),
})

export const Route = createFileRoute("/products/$productId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      getApiProductsByIdOptions({
        path: { id: Number(params.productId) },
      }),
    ),
  component: ProductDetailPage,
  errorComponent: CatchBoundary,
  pendingComponent: DetailSkeleton,
})

function ProductDetailPage() {
  const { productId } = Route.useParams()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const goBack = useBack("/products")
  const id = Number(productId)

  const { data: result } = useSuspenseQuery(
    getApiProductsByIdOptions({ path: { id } }),
  )

  const product = result.data

  const updateMutation = useMutation({
    mutationFn: (body: PatchApiProductsByIdData["body"]) =>
      patchApiProductsById({ path: { id }, body, throwOnError: true }),
    onMutate: async (body) => {
      await queryClient.cancelQueries({
        queryKey: getApiProductsByIdQueryKey({ path: { id } }),
      })
      const previous = queryClient.getQueryData(
        getApiProductsByIdQueryKey({ path: { id } }),
      )
      queryClient.setQueryData(
        getApiProductsByIdQueryKey({ path: { id } }),
        (old: typeof result | undefined) =>
          old ? { data: { ...old.data, ...body } } : old,
      )
      return { previous }
    },
    onError: (err, _body, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          getApiProductsByIdQueryKey({ path: { id } }),
          context.previous,
        )
      }
      toast.error(getApiErrorMessage(err, "Failed to update product"))
    },
    onSuccess: () => {
      toast.success("Product updated")
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: getApiProductsByIdQueryKey({ path: { id } }),
      })
      queryClient.invalidateQueries({
        queryKey: getApiProductsQueryKey(),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () =>
      deleteApiProductsById({ path: { id }, throwOnError: true }),
    onSuccess: () => {
      toast.success("Product deleted")
      navigate({ to: "/products" })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to delete product")),
  })

  const form = useForm({
    defaultValues: {
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      minStock: product.minStock,
      category: product.category as z.infer<typeof updateSchema>["category"],
    },
    validators: { onSubmit: updateSchema },
    onSubmit: ({ value }) => updateMutation.mutate(value),
  })

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex min-h-10 items-center gap-2">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <IconArrowLeft />
        </Button>
        <h2 className="text-lg font-semibold">{product.name}</h2>
        <Badge variant="outline" className="ml-2">
          {product.sku}
        </Badge>
        <Badge
          className="ml-1"
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
        <div className="ml-auto">
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

      <h3 className="text-base font-semibold">Edit Product</h3>

      <Card>
        <CardContent className="pt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
            className="grid gap-4 max-w-lg"
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
            <div className="grid grid-cols-2 gap-4">
              <form.Field
                name="price"
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Price</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
                    />
                    <FieldError field={field} />
                  </div>
                )}
              />
              <form.Field
                name="category"
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Category</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) =>
                        field.handleChange(
                          v as z.infer<typeof updateSchema>["category"],
                        )
                      }
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue>
                          {(value: string) =>
                            CATEGORY_LABELS[value as keyof typeof CATEGORY_LABELS] ?? "Category"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_VALUES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {CATEGORY_LABELS[c]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError field={field} />
                  </div>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <form.Field
                name="quantity"
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Quantity</Label>
                    <Input
                      id={field.name}
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
                    />
                    <FieldError field={field} />
                  </div>
                )}
              />
              <form.Field
                name="minStock"
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Min Stock</Label>
                    <Input
                      id={field.name}
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
                    />
                    <FieldError field={field} />
                  </div>
                )}
              />
            </div>
            <div className="text-muted-foreground text-sm">
              Store: {product.storeName}
            </div>
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
  )
}


