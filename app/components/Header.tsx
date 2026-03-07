"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ProjectMeta } from "./useProjectStorage";

export interface HeaderProps {
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
  onExport?: () => void;
  onImport?: () => Promise<unknown>;
  onSave?: () => void;
  projectList?: ProjectMeta[];
  onSwitchProject?: (id: string) => unknown;
  onNewProject?: () => void;
  onDeleteProject?: () => void;
  refreshProjectList?: () => ProjectMeta[];
}

export function Header(props: HeaderProps = {}) {
  const {
    zoom: controlledZoom,
    onZoomIn,
    onZoomOut,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    projectName: controlledName,
    onProjectNameChange,
    onExport,
    onImport,
    onSave,
    projectList: initialProjectList = [],
    onSwitchProject,
    onNewProject,
    onDeleteProject,
    refreshProjectList,
  } = props;

  const [localZoom, setLocalZoom] = useState(100);
  const zoom = controlledZoom ?? localZoom;
  const handleZoomIn =
    onZoomIn ?? (() => setLocalZoom((z) => Math.min(200, z + 10)));
  const handleZoomOut =
    onZoomOut ?? (() => setLocalZoom((z) => Math.max(20, z - 10)));

  const projectName = controlledName ?? "Novo Projeto";
  const [isEditingName, setIsEditingName] = useState(false);
  const [editValue, setEditValue] = useState(projectName);
  const inputRef = useRef<HTMLInputElement>(null);

  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [projectList, setProjectList] = useState(initialProjectList);
  const menuRef = useRef<HTMLDivElement>(null);
  const [saveFlash, setSaveFlash] = useState(false);

  useEffect(() => {
    setEditValue(projectName);
  }, [projectName]);

  useEffect(() => {
    if (isEditingName) inputRef.current?.focus();
  }, [isEditingName]);

  useEffect(() => {
    if (!showProjectMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        setShowProjectMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProjectMenu]);

  const saveName = () => {
    const trimmed = editValue.trim();
    if (trimmed) {
      onProjectNameChange?.(trimmed);
    } else {
      setEditValue(projectName);
    }
    setIsEditingName(false);
  };

  const handleSave = useCallback(() => {
    onSave?.();
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1200);
  }, [onSave]);

  const handleToggleMenu = useCallback(() => {
    if (!showProjectMenu && refreshProjectList) {
      setProjectList(refreshProjectList());
    }
    setShowProjectMenu((v) => !v);
  }, [showProjectMenu, refreshProjectList]);

  const handleSwitchProject = useCallback(
    (id: string) => {
      onSwitchProject?.(id);
      setShowProjectMenu(false);
    },
    [onSwitchProject]
  );

  const handleNewProject = useCallback(() => {
    onNewProject?.();
    setShowProjectMenu(false);
  }, [onNewProject]);

  const handleImport = useCallback(async () => {
    await onImport?.();
    setShowProjectMenu(false);
  }, [onImport]);

  const handleDeleteProject = useCallback(() => {
    if (confirm("Tem certeza que deseja excluir este projeto?")) {
      onDeleteProject?.();
      setShowProjectMenu(false);
    }
  }, [onDeleteProject]);

  return (
    <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark px-4 py-2 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-3xl font-bold">
            polyline
          </span>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">
            InfraCanvas Pro
          </h2>
        </div>
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
        <div className="flex items-center gap-4">
          <div className="relative" ref={menuRef}>
            {isEditingName ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") {
                    setEditValue(projectName);
                    setIsEditingName(false);
                  }
                }}
                className="text-sm font-medium text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 min-w-[180px] focus:ring-2 focus:ring-primary/50 focus:outline-none"
                aria-label="Nome do projeto"
              />
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditValue(projectName);
                    setIsEditingName(true);
                  }}
                  className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-2 py-1 transition-colors text-left flex items-center gap-1.5"
                  title="Clique para editar o nome do projeto"
                >
                  <span>{projectName}</span>
                  <span className="material-symbols-outlined text-base opacity-60">
                    edit
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleMenu}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  title="Projetos salvos"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showProjectMenu ? "expand_less" : "expand_more"}
                  </span>
                </button>
              </div>
            )}

            {showProjectMenu && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Projetos Salvos
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleImport}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-primary transition-colors"
                      title="Importar projeto (.json)"
                    >
                      <span className="material-symbols-outlined text-lg">
                        upload_file
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNewProject}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-primary transition-colors"
                      title="Novo projeto"
                    >
                      <span className="material-symbols-outlined text-lg">
                        add
                      </span>
                    </button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {projectList.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-400">
                      Nenhum projeto salvo
                    </div>
                  ) : (
                    projectList.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSwitchProject(p.id)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {p.name}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {formatDate(p.updatedAt)}
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-lg text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          arrow_forward
                        </span>
                      </button>
                    ))
                  )}
                </div>
                {projectList.length > 0 && (
                  <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={handleDeleteProject}
                      className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">
                        delete
                      </span>
                      Excluir projeto atual
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Desfazer"
            >
              <span className="material-symbols-outlined text-xl">undo</span>
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Refazer"
            >
              <span className="material-symbols-outlined text-xl">redo</span>
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {saveFlash && (
          <span className="text-xs text-emerald-500 font-medium animate-pulse">
            Salvo!
          </span>
        )}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 mr-4">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Diminuir zoom"
            disabled={zoom <= 20}
          >
            <span className="material-symbols-outlined text-xl">remove</span>
          </button>
          <span className="text-xs font-bold px-2 w-12 text-center tabular-nums">
            {Math.round(zoom)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Aumentar zoom"
            disabled={zoom >= 200}
          >
            <span className="material-symbols-outlined text-xl">add</span>
          </button>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Salvar projeto (Ctrl+S)"
        >
          <span className="material-symbols-outlined text-xl">save</span>
        </button>
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Exportar como arquivo .json"
        >
          <span className="material-symbols-outlined text-xl">download</span>
          <span>Export</span>
        </button>
        <button
          type="button"
          onClick={handleImport}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
          title="Importar projeto de arquivo .json"
        >
          <span className="material-symbols-outlined text-xl">upload_file</span>
          <span>Import</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center overflow-hidden ml-2">
          <span className="material-symbols-outlined text-primary text-lg">
            person
          </span>
        </div>
      </div>
    </header>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `${diffMins} min atrás`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d atrás`;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
