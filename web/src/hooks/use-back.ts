import { useNavigate, useRouterState } from "@tanstack/react-router"

export function useBack(fallback: string) {
  const navigate = useNavigate()
  const routerIndex = useRouterState({ select: (s) => s.location.state.__TSR_index ?? 0 })

  return () => {
    if (routerIndex > 0) {
      window.history.back()
    } else {
      navigate({ to: fallback })
    }
  }
}
