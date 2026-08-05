"use client";

import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function AuthNav() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <div className="w-32 h-9" />;

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <UserButton />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button asChild variant="ghost" size="sm">
        <Link href="/sign-in">Đăng nhập</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/sign-up">Bắt đầu miễn phí</Link>
      </Button>
    </div>
  );
}
