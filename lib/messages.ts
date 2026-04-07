export function withMessage(path: string, type: "success" | "error", message: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${type}=${encodeURIComponent(message)}`;
}

export function getMessageFromSearchParams(
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const success = searchParams?.success;
  const error = searchParams?.error;

  if (typeof error === "string") {
    return { type: "error" as const, text: error };
  }

  if (typeof success === "string") {
    return { type: "success" as const, text: success };
  }

  return null;
}
