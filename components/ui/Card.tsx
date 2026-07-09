// Einfache Inhalts-Karte: weiße Fläche, runde Ecken, dezenter Rand.
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border-2 border-locked bg-white p-4", className)}>
      {children}
    </div>
  );
}
