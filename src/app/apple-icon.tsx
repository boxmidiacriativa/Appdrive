import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";

// Ícone que aparece quando o cliente salva o Gui na tela inicial do iPhone.
// Usa a mesma fonte do logotipo (Manrope ExtraBold, licença OFL em src/assets).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const font = await readFile(join(process.cwd(), "src/assets/manrope-800.woff"));
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
          fontFamily: "Manrope",
          fontSize: 84,
          fontWeight: 800,
          letterSpacing: -3,
        }}
      >
        Gui
        <span style={{ color: "#c99a52" }}>.</span>
      </div>
    ),
    { ...size, fonts: [{ name: "Manrope", data: font, weight: 800, style: "normal" }] },
  );
}
