import { getAuthHeaders } from "./authService";
  import { apiClient } from "@/lib/api-client";
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
      return apiClient<User[]>("/api/users", {
        method: "GET",
      });
}

export async function updateUserStatus(userId: string, isActive: boolean, statusReason: string) {
      return apiClient(`/api/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive, statusReason }),
      });
}
export async function updateUserRole(userId: string, role: "user" | "admin") {
      return apiClient(`/api/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
}
