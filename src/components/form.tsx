"use client";

import { useActionState, useState, useTransition } from "react";
import { Copy, Check } from "lucide-react";
import type { FormResult } from "@/lib/forms";

export function ActionForm({ action, children, label = "Lưu thay đổi", quiet = false, className = "", restartLabel }: {
  action: (form: FormData) => Promise<FormResult>;
  children?: React.ReactNode;
  label?: string;
  quiet?: boolean;
  className?: string;
  restartLabel?: string;
}) {
  const [result, dispatch, pending] = useActionState((_: FormResult, data: FormData) => action(data), {});
  const [, startTransition] = useTransition();
  const [dismissedResult, setDismissedResult] = useState<FormResult>();
  if (restartLabel && result.success && result !== dismissedResult) {
    return <div className={className}>
      <p role="status" className="feedback success">{result.success}</p>
      <button type="button" className="button secondary mt-3" onClick={() => setDismissedResult(result)}>{restartLabel}</button>
    </div>;
  }
  return <form className={className} onSubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  }}>
    {children}
    <button type="submit" className={quiet ? "button secondary" : "button primary"} disabled={pending}>
      {pending ? "Đang lưu…" : label}
    </button>
    {result.error && <p role="alert" className="feedback error">{result.error}</p>}
    {result.success && result !== dismissedResult && <p role="status" className="feedback success">{result.success}</p>}
    {result.secret && <div className="copy-row"><code>{result.secret}</code><CopyButton text={result.secret} /></div>}
  </form>;
}

export function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState("Sao chép");
  return <button type="button" className="button secondary compact" onClick={async () => {
    try { await navigator.clipboard.writeText(text); setState("Đã sao chép"); }
    catch { setState("Hãy sao chép thủ công"); }
  }}>{state === "Đã sao chép" ? <Check size={15} /> : <Copy size={15} />}{state}</button>;
}
