"use client";

import { useState, useEffect } from "react";
import { Lightbulb, X } from "lucide-react";

const STORAGE_KEY = "infra-canvas-tips-shown";

const TIPS: { id: string; message: string }[] = [
  { id: "space-pan", message: "Segure a barra de espaço e arraste para navegar pelo canvas" },
  { id: "shift-scroll", message: "Shift + scroll do mouse para rolar horizontalmente" },
  { id: "doubleclick-text", message: "Duplo clique em uma caixa de texto para editar; clique simples para mover" },
  { id: "doubleclick-node", message: "Duplo clique em um nó físico para ver o fluxograma interno" },
  { id: "ctrl-s", message: "Ctrl+S salva o projeto automaticamente" },
];

function getShownIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function markAsShown(id: string) {
  try {
    const shown = getShownIds();
    if (shown.includes(id)) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...shown, id]));
  } catch {
    // ignore
  }
}

export function ShortcutTips() {
  const [tip, setTip] = useState<{ id: string; message: string } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const shown = getShownIds();
    const next = TIPS.find((t) => !shown.includes(t.id));
    if (!next) return;
    const t = setTimeout(() => {
      setTip(next);
      setVisible(true);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    if (tip) markAsShown(tip.id);
    setVisible(false);
    setTimeout(() => setTip(null), 200);
  };

  if (!tip || !visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/95 border border-slate-600/80 shadow-xl text-slate-100 text-sm transition-all duration-300"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 shrink-0">
        <Lightbulb className="w-4 h-4 text-primary" />
      </div>
      <p className="max-w-sm">{tip.message}</p>
      <button
        type="button"
        onClick={dismiss}
        className="p-1 rounded-lg hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
        aria-label="Fechar dica"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
