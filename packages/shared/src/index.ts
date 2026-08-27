export interface LoginResponse {
  accessToken: string;
  access_token: string;
  refreshToken?: string;
}

export interface UserPayload {
  userId: string;
  role: string;
}

export interface SearchResult {
  id?: string;
  title?: string;
  url: string;
  content?: string;
  snippet?: string;
}
