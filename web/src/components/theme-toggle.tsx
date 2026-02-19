import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Sun03Icon, Moon02Icon } from "@hugeicons/core-free-icons"

const STORAGE_KEY = "theme"

export function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  )

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light")
  }, [dark])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setDark((d) => !d)}
    >
      {dark
        ? <HugeiconsIcon icon={Sun03Icon} strokeWidth={1.5} />
        : <HugeiconsIcon icon={Moon02Icon} strokeWidth={1.5} />
      }
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
