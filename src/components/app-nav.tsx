"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  Bot,
  ClipboardList,
  Cpu,
  FolderTree,
  Hammer,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PlayCircle,
  Settings2,
  Sparkles,
  Waypoints,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "工作台", icon: MessageSquare },
  { href: "/demo", label: "演示", icon: Bot },
  { href: "/overview", label: "总览", icon: LayoutDashboard },
  { href: "/tickets", label: "工单", icon: ClipboardList },
  { href: "/skills", label: "Skills", icon: Sparkles },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/planner", label: "Planner", icon: Waypoints },
  { href: "/models", label: "模型", icon: Cpu },
  { href: "/eval", label: "Eval", icon: Activity },
  { href: "/knowledge", label: "知识库", icon: BookOpen },
  { href: "/catalog", label: "目录", icon: FolderTree },
  { href: "/runs", label: "运行", icon: PlayCircle },
  { href: "/settings", label: "配置", icon: Settings2 },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-[color:var(--background)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Hammer className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight">
              SubcontractOps
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              建筑分包商客服运营
            </span>
          </span>
        </Link>

        <nav className="ml-4 hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm whitespace-nowrap",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-expanded={open}
            aria-label={open ? "关闭导航" : "打开导航"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </div>

      {open ? (
        <nav className="grid gap-1 border-t border-border px-4 py-3 lg:hidden">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm",
                  active
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
}
