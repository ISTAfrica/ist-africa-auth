import { getAuthHeaders } from "./authService";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isActive: boolean; 
  statusReason:string; 
  createdAt: string;
  lastLogin: string;
}
export async function fetchUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE_URL}/api/users`,{
        method: 'GET',
        headers: getAuthHeaders(),
      });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
}

export async function updateUserStatus(userId: string, isActive: boolean, statusReason: string) {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}/status`, {
    method: "PATCH",
    headers:getAuthHeaders(),
    body: JSON.stringify({ isActive, statusReason }),
  });

  if (!res.ok) {
    try {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to update user status");
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }
      throw new Error("Failed to update user status");
    }
  }

  return res.json();
}
export async function updateUserRole(userId: string, role: "user" | "admin") {
    const res = await fetch(`${API_BASE_URL}/api/users/${userId}/role`, {
        method: "PATCH",
        headers:getAuthHeaders(),
        body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      try {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update user role");
      } catch (e) {
        if (e instanceof Error) {
          throw e;
        }
        throw new Error("Failed to update user role");
      }
    }
    return res.json();
}
