import { apiClient } from "@/lib/api-client";

export interface UserClientAssignment {
  clientId: string;
  client_id: string;
  name: string;
  description: string | null;
  status: "active" | "inactive";
  assignedAt: string;
}

export interface AssignableClient {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
}

export function listUserClients(
  userId: string,
): Promise<UserClientAssignment[]> {
  return apiClient<UserClientAssignment[]>(`/api/users/${userId}/clients`);
}

export function assignUserClients(
  userId: string,
  clientIds: string[],
): Promise<{ added: number; skipped: number }> {
  return apiClient(`/api/users/${userId}/clients`, {
    method: "POST",
    body: JSON.stringify({ clientIds }),
  });
}

export function removeUserClients(
  userId: string,
  clientIds: string[],
): Promise<{ removed: number }> {
  return apiClient(`/api/users/${userId}/clients`, {
    method: "DELETE",
    body: JSON.stringify({ clientIds }),
  });
}

export function listAssignableClients(
  userId: string,
  q?: string,
  limit = 50,
): Promise<AssignableClient[]> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("limit", String(limit));
  return apiClient<AssignableClient[]>(
    `/api/users/${userId}/clients/assignable?${params.toString()}`,
  );
}
