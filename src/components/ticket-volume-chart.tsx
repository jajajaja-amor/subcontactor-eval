"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TicketVolumePoint } from "@/lib/overview";

export function TicketVolumeChart({ data }: { data: TicketVolumePoint[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value) => [`${String(value)} 单`, "工单量"]}
            labelFormatter={(label) => `${label}`}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--primary)"
            fill="color-mix(in oklch, var(--primary) 22%, white)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
