import type { Role } from "@/lib/permissions";

export interface UserAttributes {
  email: string;
  name: string;
  role: Role;
}

export interface CurrentUser extends UserAttributes {
  id: string;
}
