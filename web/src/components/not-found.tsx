import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { IconArrowLeft, IconSearch } from "@tabler/icons-react"

export function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <IconSearch className="size-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            Page not found
          </h2>
          <p className="text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Button variant="outline" render={<Link to="/dashboard" />}>
          <IconArrowLeft className="size-4" />
          Back to dashboard
        </Button>
      </div>
    </div>
  )
}
