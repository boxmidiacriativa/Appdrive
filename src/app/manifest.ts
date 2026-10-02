import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

// Permite "baixar o Gui": salvar na tela inicial e abrir como app, sem loja.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name} — ${BRAND.tagline}`,
    short_name: BRAND.name,
    description: BRAND.description,
    start_url: "/",
    display: "standalone",
    background_color: BRAND.colors.paper,
    theme_color: BRAND.colors.ink,
    lang: "pt-BR",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
