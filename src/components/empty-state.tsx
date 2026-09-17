import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl bg-muted/60 px-4 py-8">
      <Inbox className="size-5 text-muted-foreground" aria-hidden="true" />
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
