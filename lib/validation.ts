export function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

export function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function isValidObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function requireValid<T>(
  value: T,
  fallback: T,
  check: (v: unknown) => boolean
): T {
  return check(value) ? value : fallback;
}
