import { createFileRoute } from "@tanstack/react-router"
import { useMemo } from "react"
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import {
  getApiStoresOptions,
  getApiProductsQueryKey,
  getApiStoresByIdQueryKey,
} from "@/api/@tanstack/react-query.gen"
import { postApiProducts } from "@/api"
import { toast } from "sonner"
import { CatchBoundary } from "@/components/catch-boundary"
import { FieldError } from "@/components/field-error"
import { CATEGORY_VALUES, CATEGORY_LABELS } from "@/lib/categories"
import { getApiErrorMessage } from "@/lib/api-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconArrowLeft } from "@tabler/icons-react"
import { useBack } from "@/hooks/use-back"

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  price: z.number().min(0, "Price must be positive"),
  quantity: z.number().int().min(0, "Quantity must be non-negative"),
  minStock: z.number().int().min(0, "Min stock must be non-negative"),
  category: z.enum(CATEGORY_VALUES),
  storeId: z.number().int().positive("Store is required"),
})

const searchSchema = z.object({
  storeId: z.number().int().positive().optional(),
})

export const Route = createFileRoute("/products/new")({
  validateSearch: searchSchema,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(
      getApiStoresOptions({ query: { limit: 100 } }),
    ),
  component: NewProductPage,
  errorComponent: CatchBoundary,
})

function NewProductPage() {
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const { storeId: prefilledStoreId } = Route.useSearch()
  const goBack = useBack(prefilledStoreId ? `/stores/${prefilledStoreId}` : "/products")
  const { data: storesResult } = useSuspenseQuery(
    getApiStoresOptions({ query: { limit: 100 } }),
  )
  const storeNamesById = useMemo(
    () => new Map(storesResult.data.map((s) => [s.id, s.name])),
    [storesResult.data],
  )

  const createMutation = useMutation({
    mutationFn: (body: z.infer<typeof createSchema>) =>
      postApiProducts({ body, throwOnError: true }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: getApiProductsQueryKey() })
      if (prefilledStoreId) {
        queryClient.invalidateQueries({
          queryKey: getApiStoresByIdQueryKey({ path: { id: prefilledStoreId } }),
        })
        toast.success("Product created")
        navigate({
          to: "/stores/$storeId",
          params: { storeId: String(prefilledStoreId) },
        })
      } else {
        toast.success("Product created")
        navigate({
          to: "/products/$productId",
          params: { productId: String(result.data.data.id) },
        })
      }
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to create product")),
  })

  const form = useForm({
    defaultValues: {
      name: "",
      sku: "",
      price: 0,
      quantity: 0,
      minStock: 0,
      category: "" as z.infer<typeof createSchema>["category"],
      storeId: prefilledStoreId ?? 0,
    },
    validators: { onSubmit: createSchema },
    onSubmit: ({ value }) => createMutation.mutate(value),
  })

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex min-h-10 items-center gap-2">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <IconArrowLeft />
        </Button>
        <h2 className="text-lg font-semibold">New Product</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
            className="grid gap-4 max-w-lg"
          >
            <div className="grid grid-cols-2 gap-4">
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
                name="sku"
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>SKU</Label>
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
            </div>
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
                          v as z.infer<typeof createSchema>["category"],
                        )
                      }
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue placeholder="Select category" />
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
            <form.Field
              name="storeId"
              children={(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Store</Label>
                  <Select
                    value={field.state.value ? String(field.state.value) : ""}
                    onValueChange={(v) => field.handleChange(Number(v))}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Select store">
                        {storeNamesById.get(field.state.value) ?? "Select store"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {storesResult.data.map((store) => (
                        <SelectItem key={store.id} value={String(store.id)}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  disabled={isSubmitting || createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create Product"}
                </Button>
              )}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


