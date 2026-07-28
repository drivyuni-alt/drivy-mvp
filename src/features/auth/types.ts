export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  universityId: string;
  universityEmail: string;
  degree: string;
  phone: string;
  avatarFile: File | null;
}

export type OAuthProvider = "google" | "apple";
