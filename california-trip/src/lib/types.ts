export type Look = "hat" | "kippah";

export type AppUser = {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
};

export type Member = {
  uid: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  look: Look;
  joinedAt: number;
};

export const TRIP_ID = "california";
export const TRIP_TIMEZONE = "America/Los_Angeles";
