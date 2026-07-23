export class ApiError extends Error {
  status: number;
  code: string;
  fields: string[];
  details: Record<string, unknown>;

  constructor(status: number, payload: Record<string, unknown>) {
    super(String(payload.message || "No pudimos completar la solicitud."));
    this.name = "ApiError";
    this.status = status;
    this.code = String(payload.error || "nne_api_error");
    this.fields = Array.isArray(payload.fields) ? payload.fields.map(String) : [];
    this.details = payload;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`/api/nne${path}`, {
    ...options,
    headers,
    credentials: "same-origin"
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok || payload.ok === false) throw new ApiError(response.status, payload);
  return payload as T;
}

export function formatRelativeDate(value: string) {
  const difference = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(difference) || difference < 0) return "Ahora";
  const minutes = Math.floor(difference / 60000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}
