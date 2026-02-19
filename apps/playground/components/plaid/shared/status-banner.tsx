"use client";

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  InfoIcon,
  AlertTriangleIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusBannerVariant = "success" | "warning" | "info" | "error";

type StatusBannerProps = {
  variant: StatusBannerVariant;
  title: string;
  description?: string;
  details?: Record<string, ReactNode>;
  className?: string;
};

const variantConfig: Record<
  StatusBannerVariant,
  { icon: typeof CheckCircle2Icon; bg: string; border: string; text: string }
> = {
  success: {
    icon: CheckCircle2Icon,
    bg: "bg-green-500/5",
    border: "border-green-500/20",
    text: "text-green-700 dark:text-green-400",
  },
  warning: {
    icon: AlertTriangleIcon,
    bg: "bg-amber-500/5",
    border: "border-amber-500/20",
    text: "text-amber-700 dark:text-amber-400",
  },
  info: {
    icon: InfoIcon,
    bg: "bg-blue-500/5",
    border: "border-blue-500/20",
    text: "text-blue-700 dark:text-blue-400",
  },
  error: {
    icon: AlertCircleIcon,
    bg: "bg-red-500/5",
    border: "border-red-500/20",
    text: "text-red-700 dark:text-red-400",
  },
};

export function StatusBanner({
  variant,
  title,
  description,
  details,
  className,
}: StatusBannerProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        config.bg,
        config.border,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", config.text)} />
        <div className="min-w-0 flex-1">
          <p className={cn("font-medium text-sm", config.text)}>{title}</p>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
          {details && Object.keys(details).length > 0 && (
            <dl className="mt-3 space-y-1.5">
              {Object.entries(details).map(([key, val]) => (
                <div className="flex items-baseline gap-2 text-sm" key={key}>
                  <dt className="shrink-0 text-muted-foreground">{key}:</dt>
                  <dd className="min-w-0 truncate font-mono text-xs">
                    {val}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
