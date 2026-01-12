import { getAuthHeaders } from "./authService";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://ist-africa-auth-1.onrender.com";

export interface Client {
  updated_at: string;
  id: string;
  client_id: string;
  name: string;
  description: string;
  redirect_uri: string;
  allowed_origins: string[];
  created_at: string;
  status: "active" | "inactive";
}

export interface NewClientResponse extends Client {
  client_secret: string;
}

export interface ClientPublicInfo {
  name: string;
  description: string;
}

interface CreateClientPayload {
  name: string;
  description: string;
  redirect_uri: string;
  allowed_origins: string[];
}

export const getClients = async (): Promise<Client[]> => {
  const response = await fetch(`${API_BASE_URL}/api/clients`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch clients");
  }

  return response.json();
};

export const getClientById = async (id: string): Promise<Client> => {
  const response = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch client details");
  }

  return response.json();
};

export const createClient = async (
  payload: CreateClientPayload
): Promise<NewClientResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/clients`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create client");
  }

  return response.json();
};

export async function regenerateClientSecret(clientId: string): Promise<{
  client_id: string;
  client_secret: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/clients/${clientId}/regenerate-secret`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to regenerate client secret");
  }

  return response.json();
}

export const getClientPublicInfo = async (
  clientId: string
): Promise<ClientPublicInfo> => {
  const response = await fetch(
    `${API_BASE_URL}/api/clients/public/${clientId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Application not found or is invalid");
  }

  return response.json();
};

export const updateClient = async (
  id: string,
  payload: CreateClientPayload
): Promise<Client> => {
  const response = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update client');
  }

  return response.json();
};

export const deleteClient = async (
  id: string
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete client");
  }
  try {
    return await response.json();
  } catch {
    return { message: "Client deleted successfully" };
  }
};