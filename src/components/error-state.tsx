"use client";

import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-6">
      <CircleAlert className="size-5 text-destructive" aria-hidden="true" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          重试
        </Button>
      ) : null}
    </div>
  );
}
