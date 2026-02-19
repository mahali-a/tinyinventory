import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { getApiStoresQueryKey } from "@/api/@tanstack/react-query.gen"
import { postApiStores } from "@/api"
import { toast } from "sonner"
import { CatchBoundary } from "@/components/catch-boundary"
import { FieldError } from "@/components/field-error"
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
  location: z.string().min(1, "Location is required"),
  manager: z.string().min(1, "Manager is required"),
  status: z.enum(["active", "inactive"]),
})

export const Route = createFileRoute("/stores/new")({
  component: NewStorePage,
  errorComponent: CatchBoundary,
})

function NewStorePage() {
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const goBack = useBack("/stores")

  const createMutation = useMutation({
    mutationFn: (body: z.infer<typeof createSchema>) =>
      postApiStores({ body, throwOnError: true }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: getApiStoresQueryKey() })
      toast.success("Store created")
      navigate({
        to: "/stores/$storeId",
        params: { storeId: String(result.data.data.id) },
      })
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to create store")),
  })

  const form = useForm({
    defaultValues: {
      name: "",
      location: "",
      manager: "",
      status: "active" as "active" | "inactive",
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
        <h2 className="text-lg font-semibold">New Store</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Store</CardTitle>
        </CardHeader>
        <CardContent>
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
            <div className="grid grid-cols-2 gap-4">
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
              <form.Field
                name="status"
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Status</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) =>
                        field.handleChange(v as "active" | "inactive")
                      }
                    >
                      <SelectTrigger id={field.name}>
                        <SelectValue>
                          {(value: string) => ({ active: "Active", inactive: "Inactive" })[value] ?? "Status"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError field={field} />
                  </div>
                )}
              />
            </div>
            <form.Subscribe
              selector={(state) => state.isSubmitting}
              children={(isSubmitting) => (
                <Button
                  type="submit"
                  className="w-fit"
                  disabled={isSubmitting || createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create Store"}
                </Button>
              )}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


