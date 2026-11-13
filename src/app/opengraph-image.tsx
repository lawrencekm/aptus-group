import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name}: Logistics & Safe Custody, Nairobi`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0e1420 0%, #1a2232 60%, #3a1a17 100%)",
          color: "white",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: "#f0442e", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 8, paddingBottom: 14 }}>
            <div style={{ width: 10, height: 32, background: "white", borderRadius: 3 }} />
            <div style={{ width: 10, height: 42, background: "white", borderRadius: 3 }} />
            <div style={{ width: 10, height: 26, background: "#e2b04a", borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 800 }}>{site.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>Logistics &amp; Safe Custody</div>
          <div style={{ fontSize: 34, color: "#cfd6e1", marginTop: 18 }}>JKIA Cargo Transit Zone · Airport North Road, Nairobi</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#e2b04a" }}>
          <span>{site.tagline}</span>
          <span style={{ color: "#cfd6e1" }}>{site.phoneDisplay}</span>
        </div>
      </div>
    ),
    size
  );
}
