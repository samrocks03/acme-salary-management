"use client";

import { LogOutIcon } from "lucide-react";
import { RoleBadge } from "@/components/atoms/role-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/lib/permissions";

interface UserMenuProps {
  name: string;
  email: string;
  role: Role;
  /** Server action that revokes the token and clears the cookie. */
  signOutAction: () => Promise<void>;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : `${parts[0][0]}${parts[parts.length - 1][0]}`;
  return letters.toUpperCase();
}

export function UserMenu({ name, email, role, signOutAction }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="hidden sm:inline-flex">
        <RoleBadge role={role} />
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-9 gap-2 px-1.5" aria-label={`Account menu for ${name}`}>
            <Avatar className="size-7">
              <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:inline">{name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate font-medium">{name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">{email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <form action={signOutAction}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full">
                  <LogOutIcon />
                  Sign out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
