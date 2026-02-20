import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Plaid MCP Playground";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          backgroundColor: "#111111",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Plaid icon - 2x3 grid of rectangles */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginBottom: "48px",
          }}
        >
          <div style={{ display: "flex", gap: "6px" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                backgroundColor: "#ffffff",
                borderRadius: "3px",
              }}
            />
            <div
              style={{
                width: "24px",
                height: "24px",
                backgroundColor: "#ffffff",
                borderRadius: "3px",
              }}
            />
            <div
              style={{
                width: "24px",
                height: "24px",
                backgroundColor: "#ffffff",
                borderRadius: "3px",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                backgroundColor: "#ffffff",
                borderRadius: "3px",
              }}
            />
            <div
              style={{
                width: "24px",
                height: "24px",
                backgroundColor: "#ffffff",
                borderRadius: "3px",
              }}
            />
            <div
              style={{
                width: "24px",
                height: "24px",
                backgroundColor: "#ffffff",
                borderRadius: "3px",
              }}
            />
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.1,
            marginBottom: "20px",
          }}
        >
          Plaid MCP Playground
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "28px",
            color: "#888888",
            lineHeight: 1.4,
          }}
        >
          Explore the Plaid API through conversation
        </div>
      </div>
    ),
    { ...size },
  );
}
