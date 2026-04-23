import { apiClient } from "@/lib/api-client";

export interface UserCompanyAssignment {
  companyId: string;
  name: string;
  slug: string;
  description: string | null;
  assignedAt: string | null;
}

export interface AssignableCompany {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export function listUserCompanies(
  userId: string,
): Promise<UserCompanyAssignment[]> {
  return apiClient<UserCompanyAssignment[]>(`/api/users/${userId}/companies`);
}

export function assignUserCompanies(
  userId: string,
  companyIds: string[],
): Promise<{ added: number; skipped: number }> {
  return apiClient(`/api/users/${userId}/companies`, {
    method: "POST",
    body: JSON.stringify({ companyIds }),
  });
}

export function removeUserCompanies(
  userId: string,
  companyIds: string[],
): Promise<{ removed: number }> {
  return apiClient(`/api/users/${userId}/companies`, {
    method: "DELETE",
    body: JSON.stringify({ companyIds }),
  });
}

export function listAssignableCompanies(
  userId: string,
  q?: string,
  limit = 50,
): Promise<AssignableCompany[]> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("limit", String(limit));
  return apiClient<AssignableCompany[]>(
    `/api/users/${userId}/companies/assignable?${params.toString()}`,
  );
}
