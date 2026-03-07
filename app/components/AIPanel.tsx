"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Send, X, Loader2, Plus, Paperclip } from "lucide-react";
import type { ViewMode } from "./nodes/nodeTypes";

interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface DiagramNodeData {
  id: string;
  nodeTypeId: string;
  label: string;
  position: { x: number; y: number };
  color?: string;
}

export interface DiagramTextData {
  id: string;
  type: "text";
  content: string;
  position: { x: number; y: number };
  width?: number;
  height?: number;
}

export interface DiagramData {
  viewMode?: "physical" | "logical";
  nodes: DiagramNodeData[];
  texts?: DiagramTextData[];
  edges: {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    direction?: "send" | "receive" | "bidirectional";
  }[];
  /** Fluxogramas lógicos dentro de nós físicos (modo physical). forNodeId referencia id do nó no array nodes. */
  innerFlows?: {
    forNodeId: string;
    nodes: DiagramNodeData[];
    edges: { id: string; source: string; target: string; sourceHandle?: string; targetHandle?: string; direction?: "send" | "receive" | "bidirectional" }[];
  }[];
}

function extractDiagramJSON(text: string): DiagramData | null {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[1]);
    if (data.nodes && Array.isArray(data.nodes)) {
      return data as DiagramData;
    }
  } catch {
    /* invalid JSON */
  }
  return null;
}

function removeJsonBlock(text: string): string {
  return text.replace(/```json[\s\S]*?```/g, "").trim();
}

const ACCEPT_ATTACHMENTS = ".pdf,.html";
const MAX_ATTACHMENT_MB = 5;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const base64 = result.includes(",") ? result.split(",")[1]! : result;
        resolve(base64);
      } else if (result instanceof ArrayBuffer) {
        const bytes = new Uint8Array(result);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
        resolve(btoa(binary));
      } else reject(new Error("Unexpected read result"));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const SUGGESTIONS = [
  "Crie uma topologia de rede corporativa com firewall, switches e servidores redundantes",
  "Monte um data center com DMZ, conexões bidirecionais e alta disponibilidade",
  "Desenhe uma rede de empresa com 2 filiais conectadas por VPN",
  "Crie uma topologia em estrela com um switch core e 6 dispositivos",
];

/** Snapshot do canvas atual para a IA editar / adicionar links (envia nós e edges no request). */
export interface CurrentDiagramSnapshot {
  nodes: Array<{ id: string; label?: string; nodeTypeId?: string; position: { x: number; y: number }; type?: string }>;
  edges: Array<{ id: string; source: string; target: string; direction?: string }>;
}

interface AIPanelProps {
  viewMode: ViewMode;
  onApplyDiagram: (data: DiagramData, mode: "replace" | "append") => void;
  /** Estado atual do diagrama (nós e edges) para a IA poder editar nós e adicionar conexões. */
  currentDiagram?: CurrentDiagramSnapshot | null;
}

export function AIPanel({ viewMode, onApplyDiagram, currentDiagram }: AIPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as HTMLElement)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const sendMessage = useCallback(
    async (overrideInput?: string) => {
      const text = (overrideInput ?? input).trim();
      const hasAttachments = attachments.length > 0;
      if ((!text && !hasAttachments) || loading) return;

      const userContent = text || "Gere um fluxograma (ou diagrama) com base no(s) documento(s) anexado(s).";
      const userMessage: AIMessage = { role: "user", content: userContent };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput("");
      setLoading(true);
      setStreamingContent("");

      let attachmentsPayload: { type: "pdf" | "html"; name: string; content: string }[] = [];
      if (hasAttachments) {
        try {
          attachmentsPayload = await Promise.all(
            attachments.map(async (file) => {
              const base64 = await fileToBase64(file);
              const type = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "html";
              return { type, name: file.name, content: base64 };
            })
          );
          setAttachments([]);
        } catch (e) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Erro ao ler anexo(s): ${e instanceof Error ? e.message : String(e)}` },
          ]);
          setLoading(false);
          return;
        }
      }

      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            viewMode,
            currentDiagram: currentDiagram ?? undefined,
            attachments: attachmentsPayload.length ? attachmentsPayload : undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error || "Erro na requisição");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("Stream não disponível");

        const decoder = new TextDecoder();
        let fullContent = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setStreamingContent(fullContent);
              }
            } catch {
              /* skip */
            }
          }
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fullContent },
        ]);
        setStreamingContent("");
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Erro: ${error instanceof Error ? error.message : String(error)}`,
          },
        ]);
        setStreamingContent("");
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, viewMode, currentDiagram, attachments]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const handleTextareaInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
    },
    []
  );

  const renderMessageContent = (
    content: string,
    role: "user" | "assistant",
    index: number
  ) => {
    const diagram = role === "assistant" ? extractDiagramJSON(content) : null;
    const text = removeJsonBlock(content);

    return (
      <div
        key={index}
        className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
            role === "user"
              ? "bg-primary/20 text-slate-100 border border-primary/30"
              : "bg-slate-800/80 text-slate-200 border border-slate-700/50"
          }`}
        >
          {text && (
            <div className="ai-chat-markdown whitespace-pre-wrap">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          )}
          {diagram && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-600/50">
              <div className="text-xs text-slate-400 mb-2">
                {diagram.viewMode && (
                  <span className="inline-block px-1.5 py-0.5 rounded bg-primary/20 text-primary font-semibold mr-1.5">
                    {diagram.viewMode === "physical" ? "Físico" : "Lógico"}
                  </span>
                )}
                {diagram.nodes.length} nó(s)
                {diagram.texts?.length ? ` · ${diagram.texts.length} texto(s)` : ""}
                {" "}&middot; {diagram.edges.length} conexão(ões)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onApplyDiagram(diagram, "replace")}
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/90 hover:bg-primary text-white transition-colors cursor-pointer"
                >
                  Substituir canvas
                </button>
                <button
                  onClick={() => onApplyDiagram(diagram, "append")}
                  className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                >
                  Adicionar ao canvas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStreamingContent = () => {
    if (!streamingContent) return null;
    const text = removeJsonBlock(streamingContent);
    const hasPartialJson =
      streamingContent.includes("```json") &&
      (streamingContent.match(/```/g) || []).length < 2;

    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed bg-slate-800/80 text-slate-200 border border-slate-700/50">
          {text && (
            <div className="ai-chat-markdown whitespace-pre-wrap">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          )}
          {hasPartialJson && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              Gerando diagrama...
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="absolute bottom-20 right-4 z-30 flex items-center gap-2 px-4 py-2.5 rounded-full
            bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25
            transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-primary/30 cursor-pointer"
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Assistente IA</span>
        </button>
      )}

      {open && (
        <div
          ref={panelRef}
          className="absolute bottom-4 right-4 z-30 w-[400px] h-[520px] flex flex-col
            bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl
            shadow-2xl shadow-black/50 overflow-hidden ai-panel-enter"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/80 bg-slate-800/50">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/20">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Assistente IA
                </h3>
                <p className="text-[10px] text-slate-400">
                  Modo {viewMode === "physical" ? "Físico" : "Lógico"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setMessages([]);
                  setStreamingContent("");
                }}
                className="p-1.5 rounded-lg hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Nova conversa"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
            {messages.length === 0 && !streamingContent && (
              <div className="h-full flex flex-col items-center justify-center text-center px-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                  <Sparkles className="h-6 w-6 text-primary/60" />
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Descreva o diagrama que deseja criar
                </p>
                <div className="flex flex-col gap-2 w-full">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(s);
                        sendMessage(s);
                      }}
                      className="text-left text-xs text-slate-400 hover:text-slate-200 px-3 py-2
                        rounded-lg border border-slate-700/50 hover:border-slate-600
                        hover:bg-slate-800/50 transition-all cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) =>
              renderMessageContent(msg.content, msg.role, i)
            )}
            {renderStreamingContent()}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-1">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {attachments.map((file, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700/80
                      text-xs text-slate-200 border border-slate-600"
                  >
                    {file.name}
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                      className="p-0.5 rounded hover:bg-slate-600 text-slate-400 hover:text-slate-100 cursor-pointer"
                      aria-label="Remover anexo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div
              className="flex items-end gap-2 bg-slate-800/80 border border-slate-700/60
                rounded-xl px-3 py-2 focus-within:border-primary/50 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_ATTACHMENTS}
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  const valid = files.filter((f) => {
                    const ok = f.size <= MAX_ATTACHMENT_MB * 1024 * 1024;
                    const isPdf = f.name.toLowerCase().endsWith(".pdf");
                    const isHtml = f.name.toLowerCase().endsWith(".html") || f.name.toLowerCase().endsWith(".htm");
                    return ok && (isPdf || isHtml);
                  });
                  setAttachments((prev) => [...prev, ...valid]);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="p-1.5 rounded-lg hover:bg-slate-700/80 text-slate-400 hover:text-slate-200
                  disabled:opacity-50 shrink-0 cursor-pointer"
                title="Anexar PDF ou HTML (até 5 MB)"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder={attachments.length ? "Descreva o que deseja (opcional) ou envie..." : "Descreva o diagrama ou anexe PDF/HTML..."}
                rows={1}
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500
                  resize-none outline-none"
                style={{ minHeight: "24px", maxHeight: "96px" }}
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={(!input.trim() && !attachments.length) || loading}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/90
                  hover:bg-primary disabled:opacity-30 disabled:cursor-not-allowed
                  text-white transition-all shrink-0 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">PDF e HTML até {MAX_ATTACHMENT_MB} MB para gerar fluxograma a partir do conteúdo.</p>
          </div>
        </div>
      )}
    </>
  );
}
