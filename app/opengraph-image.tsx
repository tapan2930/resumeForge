import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const alt = "ResumeForge | AI-Powered Resume Builder";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 128,
          background: "linear-gradient(to bottom right, #1a1a1a, #0a0a0a)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(to bottom right, #f59e0b, #d97706)",
            width: "300px",
            height: "300px",
            borderRadius: "60px",
            marginBottom: "40px",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="200"
            height="200"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.27a1 1 0 0 0 0 1.83l8.58 4.09a2 2 0 0 0 1.66 0l8.58-4.09a1 1 0 0 0 0-1.83Z" />
            <path d="m2.6 12.27 8.58 4.09a2 2 0 0 0 1.66 0l8.58-4.09" />
            <path d="m2.6 16.27 8.58 4.09a2 2 0 0 0 1.66 0l8.58-4.09" />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: "72px", fontWeight: "bold", letterSpacing: "-0.05em" }}>ResumeForge</div>
          <div style={{ fontSize: "32px", color: "#a1a1aa", marginTop: "16px" }}>AI-Powered Resume Builder & ATS Scorer</div>
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}
