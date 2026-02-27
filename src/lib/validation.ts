const UUID_V4_OR_V1_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID_V4_OR_V1_PATTERN.test(value);
}

export function parseUuid(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("VALIDATION_ERROR");
  }

  const normalized = value.trim();
  if (!isUuid(normalized)) {
    throw new Error("VALIDATION_ERROR");
  }

  return normalized;
}

export function parseTrimmedString(
  value: unknown,
  options: { minLength?: number; maxLength: number },
) {
  if (typeof value !== "string") {
    throw new Error("VALIDATION_ERROR");
  }

  const normalized = value.trim();
  const minLength = options.minLength ?? 1;
  if (normalized.length < minLength || normalized.length > options.maxLength) {
    throw new Error("VALIDATION_ERROR");
  }

  return normalized;
}
