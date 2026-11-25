"use client";

import { useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function Composer({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // 입력 길이에 맞춰 높이를 늘린다. 5줄을 넘으면 내부 스크롤로 넘긴다.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // 한글 입력 중(조합 중)에는 Enter 가 확정용이라 전송하면 안 된다.
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  }

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div
      className={cn(
        "flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 transition-colors",
        "focus-within:border-brand",
      )}
    >
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-[14.5px] leading-relaxed outline-none placeholder:text-muted/70"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSend}
        aria-label="질문 보내기"
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl transition-all active:scale-95",
          canSend
            ? "bg-brand text-brand-fg hover:bg-brand-hover"
            : "cursor-not-allowed bg-surface-2 text-muted",
        )}
      >
        <ArrowUp size={17} />
      </button>
    </div>
  );
}
