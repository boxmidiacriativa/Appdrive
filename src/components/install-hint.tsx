"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui";

type InstallPromptEvent = Event & { prompt: () => Promise<void> };

// "Baixa o Gui": salvar o app na tela inicial do celular (PWA), sem loja de aplicativos.
// No Android usa o convite nativo do navegador; no iPhone mostra o passo a passo.
export function InstallHint() {
  const [mode, setMode] = useState<"hidden" | "android" | "ios">("hidden");
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isIos) setMode("ios");

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPromptEvent);
      setMode("android");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (mode === "hidden") return null;

  return (
    <section className="mt-10 rounded-2xl bg-ink px-5 py-5 text-white">
      <p className="text-lg font-bold">Já tem o Gui?</p>
      {mode === "android" && prompt ? (
        <>
          <p className="mt-1 text-sm text-white/70">Baixa o Gui na tela do seu celular e reserve com um toque.</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            full
            onClick={async () => {
              await prompt.prompt();
              setMode("hidden");
            }}
          >
            Baixar o Gui
          </Button>
        </>
      ) : (
        <p className="mt-1 text-sm leading-relaxed text-white/70">
          Baixa o Gui no seu iPhone: toque em <span className="font-semibold text-white">Compartilhar</span> e depois em{" "}
          <span className="font-semibold text-white">Adicionar à Tela de Início</span>.
        </p>
      )}
    </section>
  );
}
