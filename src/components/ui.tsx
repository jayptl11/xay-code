import type { ComponentProps, ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ChevronDown } from "lucide-react";

const cn = (...classes: (string | undefined)[]) => twMerge(clsx(classes));

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("control", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn("control textarea", className)} {...props} />;
}

export function Select({ children, ...props }: ComponentProps<"select">) {
  return <span className="select-wrap"><select className="control" {...props}>{children}</select><ChevronDown size={16} aria-hidden /></span>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export function CheckField({ label, ...props }: ComponentProps<"input"> & { label: string }) {
  return <label className="check-field"><input type="checkbox" {...props} /><span>{label}</span></label>;
}

export function Card({ title, children, className, id }: { title?: string; children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={cn("card", className)}>{title && <h2>{title}</h2>}{children}</section>;
}

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "orange" }) {
  return <span className={"pill " + tone}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) { return <p className="empty">{children}</p>; }

export function Hidden({ data }: { data: Record<string, string> }) {
  return <>{Object.entries(data).map(([name, val]) => <input key={name} type="hidden" name={name} value={val} />)}</>;
}
