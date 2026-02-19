import { createFileRoute, Link } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Building04Icon,
  Package01Icon,
  DollarCircleIcon,
  AlertDiamondIcon,
} from "@hugeicons/core-free-icons"
import { getApiDashboardMetricsOptions } from "@/api/@tanstack/react-query.gen"
import { CatchBoundary } from "@/components/catch-boundary"
import { DashboardSkeleton } from "@/components/page-skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const Route = createFileRoute("/dashboard")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(getApiDashboardMetricsOptions()),
  component: DashboardPage,
  errorComponent: CatchBoundary,
  pendingComponent: DashboardSkeleton,
})

function DashboardPage() {
  const { data: metrics } = useSuspenseQuery(getApiDashboardMetricsOptions())

  const metricCards = [
    {
      label: "Total Stores",
      value: metrics.data.totalStores,
      limit: `${metrics.data.activeStores} active`,
      percentage: metrics.data.totalStores > 0
        ? (metrics.data.activeStores / metrics.data.totalStores) * 100
        : 0,
      icon: <HugeiconsIcon icon={Building04Icon} strokeWidth={1.5} />,
    },
    {
      label: "Total Products",
      value: metrics.data.totalProducts,
      limit: `across ${metrics.data.totalStores} stores`,
      percentage: 100,
      icon: <HugeiconsIcon icon={Package01Icon} strokeWidth={1.5} />,
    },
    {
      label: "Inventory Value",
      value: `$${metrics.data.inventoryValue.toLocaleString()}`,
      limit: `${metrics.data.totalProducts} products`,
      percentage: 100,
      icon: <HugeiconsIcon icon={DollarCircleIcon} strokeWidth={1.5} />,
    },
    {
      label: "Low Stock Alerts",
      value: metrics.data.lowStockCount,
      limit: `${metrics.data.outOfStockCount} out of stock`,
      percentage: metrics.data.totalProducts > 0
        ? (metrics.data.lowStockCount / metrics.data.totalProducts) * 100
        : 0,
      icon: <HugeiconsIcon icon={AlertDiamondIcon} strokeWidth={1.5} />,
      warning: metrics.data.lowStockCount > 0,
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((item) => (
          <Card key={item.label} className="py-4">
            <CardContent>
              <dt className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                {item.label}
                {item.icon}
              </dt>
              <dd
                className={`mt-1 text-2xl font-semibold tabular-nums ${
                  item.warning
                    ? "text-orange-500 dark:text-orange-400"
                    : "text-foreground"
                }`}
              >
                {item.value}
              </dd>
              <Progress
                value={item.percentage}
                className="mt-4 h-1.5"
              />
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

      {metrics.data.lowStockProducts.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Low Stock Alerts
          </h2>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden sm:table-cell">SKU</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">
                    Min Stock
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.data.lowStockProducts.map((product) => (
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
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {product.sku}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product.storeName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {product.quantity}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {product.minStock}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.status === "low_stock" ? "warning" : "danger"}>
                        {product.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
