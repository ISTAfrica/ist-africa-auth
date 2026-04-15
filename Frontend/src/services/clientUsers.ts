import { apiClient } from "@/lib/api-client";

export interface ClientMember {
  userId: string;
  email: string;
  name: string;
  membershipStatus: "ist_member" | "ext_member";
  isActive: boolean;
  assignedAt: string;
}

export interface AssignableUser {
  id: string;
  email: string;
  name: string;
  membershipStatus: "ist_member" | "ext_member";
}

export function listClientMembers(
  clientId: string,
  q?: string,
): Promise<ClientMember[]> {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiClient<ClientMember[]>(`/api/clients/${clientId}/users${qs}`);
}

export function assignClientMembers(
  clientId: string,
  userIds: string[],
): Promise<{ added: number; skipped: number }> {
  return apiClient(`/api/clients/${clientId}/users`, {
    method: "POST",
    body: JSON.stringify({ userIds }),
  });
}

export function removeClientMembers(
  clientId: string,
  userIds: string[],
): Promise<{ removed: number }> {
  return apiClient(`/api/clients/${clientId}/users`, {
    method: "DELETE",
    body: JSON.stringify({ userIds }),
  });
}

export function listAssignableUsers(
  clientId: string,
  q?: string,
  limit = 50,
): Promise<AssignableUser[]> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("limit", String(limit));
  return apiClient<AssignableUser[]>(
    `/api/clients/${clientId}/users/assignable?${params.toString()}`,
  );
}
