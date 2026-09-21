import { NextResponse } from "next/server";
import { z } from "zod";

import { LlmProviderError } from "@/lib/agent/llm";
import { runAgent } from "@/lib/agent/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  question: z.string().min(1),
  conversationId: z.string().optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional(),
  source: z.enum(["web", "demo", "api", "retry", "handoff"]).default("api"),
  simulateToolError: z.string().optional(),
  stream: z.boolean().optional(),
});

function encodeEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "请求体无效，需要 question" }, { status: 400 });
  }

  const accept = request.headers.get("accept") ?? "";
  const stream = parsed.data.stream !== false && accept.includes("text/event-stream");

  if (!stream) {
    try {
      const run = await runAgent({
        question: parsed.data.question,
        source: parsed.data.source,
        conversationId: parsed.data.conversationId,
        conversationHistory: parsed.data.conversationHistory,
        simulateToolError: parsed.data.simulateToolError,
      });
      return NextResponse.json({ ok: run.status !== "失败", run });
    } catch (error) {
      if (error instanceof LlmProviderError) {
        return NextResponse.json(error.toJSON(), { status: 400 });
      }
      const message = error instanceof Error ? error.message : "运行失败";
      return NextResponse.json({ ok: false, message }, { status: 500 });
    }
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(encodeEvent(event, data)));
      };
      try {
        await runAgent({
          question: parsed.data.question,
          source: parsed.data.source,
          conversationId: parsed.data.conversationId,
          conversationHistory: parsed.data.conversationHistory,
          simulateToolError: parsed.data.simulateToolError,
          onEvent: (event) => send(event.type, event),
        });
      } catch (error) {
        if (error instanceof LlmProviderError) {
          send("error", error.toJSON());
        } else {
          send("error", {
            message: error instanceof Error ? error.message : "运行失败",
          });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
