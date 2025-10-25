export type UserPublic = {
  id: number;
  email: string;
  username?: string | null;
};

export type RegisterBody = {
  email: string;
  username?: string;
  password: string;
};

export type LoginBody = {
  username: string; // can be username or email
  password: string;
};
