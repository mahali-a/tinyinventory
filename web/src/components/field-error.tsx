export function FieldError({
  field,
}: {
  field: { state: { meta: { errors: unknown[] } } }
}) {
  return field.state.meta.errors.length > 0 ? (
    <p className="text-sm text-destructive">
      {String(field.state.meta.errors[0])}
    </p>
  ) : null
}
