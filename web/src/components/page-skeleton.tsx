import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="px-4 lg:px-6">
        <Skeleton className="mb-3 h-6 w-40" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4 px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-96 rounded-lg" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48" />
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 py-4 px-4 lg:px-6">
      <div className="flex items-center gap-2">
        <Skeleton className="size-9" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="grid gap-4 @xl/main:grid-cols-2">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  )
}
