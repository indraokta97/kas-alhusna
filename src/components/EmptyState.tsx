import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  image?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, image, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-9 text-center">
      {image ? (
        <img
          src={image}
          alt=""
          aria-hidden="true"
          width={479}
          height={509}
          className="h-[132px] w-auto object-contain"
            style={{ clipPath: "inset(0 0 12% 0)" }}
        />
      ) : Icon ? (
        <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
          <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
        </span>
      ) : null}
      <p className={`${image ? "mt-1" : "mt-3"} text-[14px] font-bold text-ink`}>{title}</p>
      <p className="mt-1 max-w-[280px] text-[12px] leading-relaxed text-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
