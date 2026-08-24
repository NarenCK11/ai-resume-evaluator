import { apiClient } from "./client";
import type { User } from "../types";

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function signup(email: string, password: string, fullName: string) {
  const { data } = await apiClient.post<AuthResponse>("/auth/signup", {
    email,
    password,
    full_name: fullName,
  });
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", { email, password });
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get<User>("/auth/me");
  return data;
}
