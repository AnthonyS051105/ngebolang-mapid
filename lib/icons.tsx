import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

export function getIcon(name: string): LucideIcon {
  const pascal = name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  return (Icons as unknown as Record<string, LucideIcon>)[pascal] ?? Icons.Circle;
}

export function iconMarkup(name: string, props: Record<string, unknown>) {
  const Icon = getIcon(name);
  return renderToStaticMarkup(<Icon {...props} />);
}
