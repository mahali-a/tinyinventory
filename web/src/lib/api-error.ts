type ApiErrorBody = {
  error: {
    code: string
    message: string
    details: Array<{ field: string; message: string }>
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as ApiErrorBody).error?.message === "string"
  )
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (isApiErrorBody(err)) return err.error.message
  return fallback
}
