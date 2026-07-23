import type { DashboardData, UserProfile } from "../types";
import { apiRequest } from "./api";
import { mapDashboard, mapUser } from "./mappers";

export interface SignupInput {
  name: string;
  username: string;
  email: string;
  password: string;
  referral_code?: string;
  company_website?: string;
}

export const usersService = {
  async session(): Promise<UserProfile> {
    const result = await apiRequest<any>("/auth/session");
    return mapUser(result.user);
  },
  async login(identifier: string, password: string): Promise<UserProfile> {
    const result = await apiRequest<any>("/auth/session", {
      method: "POST",
      body: JSON.stringify({ identifier, password })
    });
    return mapUser(result.user);
  },
  async signup(input: SignupInput): Promise<UserProfile> {
    const result = await apiRequest<any>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(input)
    });
    return mapUser(result.user);
  },
  async logout(): Promise<void> {
    await apiRequest("/auth/session", { method: "DELETE" });
  },
  async dashboard(): Promise<DashboardData> {
    return mapDashboard(await apiRequest<any>("/dashboard"));
  }
};
