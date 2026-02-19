import {
  type ErrorComponentProps,
  useRouter,
} from "@tanstack/react-router"
import { IconRefresh, IconHome, IconAlertCircle } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export function CatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred"

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <IconAlertCircle className="size-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.invalidate()}>
            <IconRefresh className="size-4" />
            Retry
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.navigate({ to: "/" })}
          >
            <IconHome className="size-4" />
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
