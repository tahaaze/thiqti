"use client";

import { usePathname } from "next/navigation";
import MarketingNavbar from "@/components/MarketingNavbar";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <>
      {pathname !== "/" && <MarketingNavbar />}
      {children}
    </>
  );
}
