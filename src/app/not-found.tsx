import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <div className="space-y-4">
      <EmptyState
        title="没有找到这个页面"
        description="导航走错了。回到总览继续处理工单、Skill 和 Eval。"
      />
      <Button asChild>
        <Link href="/">返回总览</Link>
      </Button>
    </div>
  );
}
