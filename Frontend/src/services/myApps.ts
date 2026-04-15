import { apiClient } from "@/lib/api-client";

export interface MyApp {
  client_id: string;
  name: string;
  description: string | null;
  home_url: string;
  favicon_url: string | null;
}

export function listMyApps(): Promise<MyApp[]> {
  return apiClient<MyApp[]>("/api/user/apps");
}
