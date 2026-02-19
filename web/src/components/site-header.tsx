import { useRouterState } from "@tanstack/react-router"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/stores": "Stores",
  "/products": "Products",
}

function usePageTitle() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const base = "/" + pathname.split("/")[1]
  return routeTitles[base] ?? "Knostic"
}

export function SiteHeader() {
  const title = usePageTitle()

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14">
      <div className="flex w-full items-center gap-2 px-6 lg:px-8">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 data-vertical:self-auto"
        />
        <h1 className="text-sm font-medium tracking-wide">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
