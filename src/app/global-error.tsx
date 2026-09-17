"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#fbf6ee",
          color: "#3b2a1f",
          fontFamily: "sans-serif",
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 20, margin: 0 }}>应用发生错误</h1>
        <p style={{ marginTop: 8, fontSize: 14 }}>
          {error.digest ? `错误编号 ${error.digest}` : "请重试当前操作。"}
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            marginTop: 16,
            border: "1px solid #c46a3a",
            background: "#c46a3a",
            color: "#fff",
            borderRadius: 8,
            padding: "8px 12px",
          }}
        >
          重试
        </button>
      </body>
    </html>
  );
}
