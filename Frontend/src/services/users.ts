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
    const res = await fetch(`${API_BASE_URL}/api/users`);
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
}

export async function updateUserStatus(userId: string, isActive: boolean, statusReason: string) {
  const res = await fetch(`${API_BASE_URL}/api/users/${userId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive, statusReason }),
  });

  if (!res.ok) {
    const errorText = await res.text(); 
    console.error("Update status failed:", errorText);
    throw new Error("Failed to update user status");
  }

  return res.json();
}
export async function updateUserRole(userId: string, role: "user" | "admin") {
    const res = await fetch(`${API_BASE_URL}/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error("Failed to update user role");
    return res.json();
}
