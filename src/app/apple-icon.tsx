import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

// Ícone que aparece quando o cliente salva o Gui na tela inicial do iPhone
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND.colors.ink,
          color: "#ffffff",
          fontSize: 92,
          fontWeight: 800,
          letterSpacing: -4,
        }}
      >
        Gui
        <span style={{ color: "#c99a52" }}>.</span>
      </div>
    ),
    size,
  );
}
