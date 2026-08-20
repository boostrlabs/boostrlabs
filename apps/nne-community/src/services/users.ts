import type { DashboardData, ReferralPreview, UserProfile } from "../types";
import { apiRequest } from "./api";
import { mapDashboard, mapUser } from "./mappers";

export interface SignupInput {
  name: string;
  username: string;
  email: string;
  password: string;
  referral_code?: string;
  artist_role: "artist" | "producer" | "engineer" | "designer" | "manager" | "fan" | "other";
  country: string;
  city?: string;
  instagram_handle?: string;
  whatsapp_contact?: string;
  telegram_handle?: string;
  primary_contact: "instagram" | "whatsapp" | "telegram";
  bio: string;
  promo_code?: string;
  company_website?: string;
  admin_invite?: string;
}

export interface SignupResult {
  application: { id: string; status: "pending"; username: string; email: string };
  verification_required: boolean;
  message: string;
}

export interface EmailVerificationResult {
  verified: boolean;
  activated: boolean;
  role: "admin" | null;
  username: string;
  message: string;
}

export interface LoginChallengeResult {
  two_factor_required: true;
  challenge_token: string;
  channel: "email" | "whatsapp";
  destination: string;
  expires_in: number;
}

export const usersService = {
  async session(): Promise<UserProfile> {
    const result = await apiRequest<any>("/auth/session");
    return mapUser(result.user);
  },
  async login(identifier: string, password: string): Promise<LoginChallengeResult> {
    return apiRequest<LoginChallengeResult>("/auth/session", {
      method: "POST",
      body: JSON.stringify({ identifier, password })
    });
  },
  async verifyLoginCode(challengeToken: string, code: string): Promise<UserProfile> {
    const result = await apiRequest<any>("/auth/session/verify", {
      method: "POST",
      body: JSON.stringify({ challenge_token: challengeToken, code })
    });
    return mapUser(result.user);
  },
  async signup(input: SignupInput): Promise<SignupResult> {
    return apiRequest<SignupResult>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },
  async logout(): Promise<void> {
    await apiRequest("/auth/session", { method: "DELETE" });
  },
  async requestPasswordReset(identifier: string, channel: "email" | "sms" = "email"): Promise<string> {
    const result = await apiRequest<{ message: string }>("/auth/password/forgot", {
      method: "POST",
      body: JSON.stringify({ identifier, channel })
    });
    return result.message;
  },
  async resetPassword(token: string, password: string): Promise<string> {
    const result = await apiRequest<{ message: string }>("/auth/password/reset", {
      method: "POST",
      body: JSON.stringify({ token, password })
    });
    return result.message;
  },
  async verifyEmail(token: string): Promise<EmailVerificationResult> {
    return apiRequest<EmailVerificationResult>("/auth/email/verify", {
      method: "POST",
      body: JSON.stringify({ token })
    });
  },
  async resendVerification(identifier: string): Promise<string> {
    const result = await apiRequest<{ message: string }>("/auth/email/resend", {
      method: "POST",
      body: JSON.stringify({ identifier })
    });
    return result.message;
  },
  async dashboard(): Promise<DashboardData> {
    return mapDashboard(await apiRequest<any>("/dashboard"));
  },
  async referralPreview(code: string): Promise<ReferralPreview> {
    const result = await apiRequest<{ referral: ReferralPreview }>(
      `/referrals/preview?code=${encodeURIComponent(code)}`
    );
    return result.referral;
  }
};
