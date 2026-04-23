import { getAuthHeaders } from "./authService";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyPublic {
  id: string;
  name: string;
  slug: string;
}

export const getPublicCompanies = async (): Promise<CompanyPublic[]> => {
  const response = await fetch(`${API_BASE_URL}/api/companies/public`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch companies");
  }

  return response.json();
};

export interface CreateCompanyPayload {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateCompanyPayload {
  name?: string;
  slug?: string;
  description?: string;
}

export const getCompanies = async (): Promise<Company[]> => {
  const response = await fetch(`${API_BASE_URL}/api/companies`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch companies");
  }

  return response.json();
};

export const getCompanyById = async (id: string): Promise<Company> => {
  const response = await fetch(`${API_BASE_URL}/api/companies/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch company details");
  }

  return response.json();
};

export const createCompany = async (
  payload: CreateCompanyPayload
): Promise<Company> => {
  const response = await fetch(`${API_BASE_URL}/api/companies`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create company");
  }

  return response.json();
};

export const updateCompany = async (
  id: string,
  payload: UpdateCompanyPayload
): Promise<Company> => {
  const response = await fetch(`${API_BASE_URL}/api/companies/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update company");
  }

  return response.json();
};

export const deleteCompany = async (
  id: string
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/companies/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete company");
  }

  try {
    return await response.json();
  } catch {
    return { message: "Company deleted successfully" };
  }
};
