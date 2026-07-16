"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkProps = {
  href: string;
  children: React.ReactNode;
};

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      className={
        isActive
          ? "rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm"
          : "rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950"
      }
      href={href}
    >
      {children}
    </Link>
  );
}
