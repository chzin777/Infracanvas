"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Edge, Viewport } from "@xyflow/react";
import type { CanvasNode } from "./canvasTypes";
import type { ViewMode } from "./nodes/nodeTypes";

export interface ProjectData {
  id: string;
  name: string;
  updatedAt: string;
  viewMode: ViewMode;
  viewport: Viewport;
  physicalNodes: CanvasNode[];
  physicalEdges: Edge[];
  logicalNodes: CanvasNode[];
  logicalEdges: Edge[];
  /** Fluxo lógico interno de cada nó físico (canvas ao dar duplo clique) */
  logicalContentByNodeId?: Record<string, { nodes: CanvasNode[]; edges: Edge[] }>;
}

export interface ProjectMeta {
  id: string;
  name: string;
  updatedAt: string;
}

const STORAGE_PREFIX = "infra-canvas";
const PROJECTS_KEY = `${STORAGE_PREFIX}-projects`;
const CURRENT_KEY = `${STORAGE_PREFIX}-current`;
const PROJECT_KEY = (id: string) => `${STORAGE_PREFIX}-project-${id}`;

function generateId() {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getProjectList(): ProjectMeta[] {
  return readJSON<ProjectMeta[]>(PROJECTS_KEY) ?? [];
}

export function getCurrentProjectId(): string | null {
  return localStorage.getItem(CURRENT_KEY) || null;
}

export function loadProject(id: string): ProjectData | null {
  return readJSON<ProjectData>(PROJECT_KEY(id));
}

export function saveProject(data: ProjectData) {
  writeJSON(PROJECT_KEY(data.id), data);

  const list = getProjectList();
  const meta: ProjectMeta = {
    id: data.id,
    name: data.name,
    updatedAt: data.updatedAt,
  };
  const idx = list.findIndex((p) => p.id === data.id);
  if (idx >= 0) {
    list[idx] = meta;
  } else {
    list.unshift(meta);
  }
  writeJSON(PROJECTS_KEY, list);
  localStorage.setItem(CURRENT_KEY, data.id);
}

export function deleteProject(id: string) {
  localStorage.removeItem(PROJECT_KEY(id));
  const list = getProjectList().filter((p) => p.id !== id);
  writeJSON(PROJECTS_KEY, list);
  const current = getCurrentProjectId();
  if (current === id) {
    localStorage.removeItem(CURRENT_KEY);
  }
}

export function exportProjectToFile(data: ProjectData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.infracanvas.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importProjectFromFile(): Promise<ProjectData | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.infracanvas.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as ProjectData;
          data.id = generateId();
          data.updatedAt = new Date().toISOString();
          resolve(data);
        } catch {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}

interface UseProjectStorageParams {
  projectName: string;
  viewMode: ViewMode;
  viewport: Viewport;
  physicalNodes: CanvasNode[];
  physicalEdges: Edge[];
  logicalNodes: CanvasNode[];
  logicalEdges: Edge[];
  logicalContentByNodeId?: Record<string, { nodes: CanvasNode[]; edges: Edge[] }>;
}

interface UseProjectStorageReturn {
  projectId: string;
  save: () => void;
  exportToFile: () => void;
  importFromFile: () => Promise<ProjectData | null>;
  projectList: ProjectMeta[];
  switchProject: (id: string) => ProjectData | null;
  createNewProject: () => string;
  deleteCurrentProject: () => string | null;
  refreshList: () => ProjectMeta[];
}

export function useProjectStorage(
  params: UseProjectStorageParams,
  onLoad: (data: ProjectData) => void
): UseProjectStorageReturn {
  const projectIdRef = useRef<string>("");
  const initializedRef = useRef(false);
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const currentId = getCurrentProjectId();
    if (currentId) {
      const data = loadProject(currentId);
      if (data) {
        projectIdRef.current = data.id;
        onLoadRef.current(data);
        return;
      }
    }

    const list = getProjectList();
    if (list.length > 0) {
      const data = loadProject(list[0].id);
      if (data) {
        projectIdRef.current = data.id;
        onLoadRef.current(data);
        return;
      }
    }

    projectIdRef.current = generateId();
  }, []);

  const buildProjectData = useCallback((): ProjectData => {
    const p = paramsRef.current;
    return {
      id: projectIdRef.current,
      name: p.projectName,
      updatedAt: new Date().toISOString(),
      viewMode: p.viewMode,
      viewport: p.viewport,
      physicalNodes: p.physicalNodes,
      physicalEdges: p.physicalEdges,
      logicalNodes: p.logicalNodes,
      logicalEdges: p.logicalEdges,
      logicalContentByNodeId: p.logicalContentByNodeId,
    };
  }, []);

  useEffect(() => {
    if (!projectIdRef.current) return;
    const timer = setTimeout(() => {
      saveProject(buildProjectData());
    }, 800);
    return () => clearTimeout(timer);
  }, [
    params.projectName,
    params.viewMode,
    params.viewport,
    params.physicalNodes,
    params.physicalEdges,
    params.logicalNodes,
    params.logicalEdges,
    params.logicalContentByNodeId,
    buildProjectData,
  ]);

  const save = useCallback(() => {
    saveProject(buildProjectData());
  }, [buildProjectData]);

  const doExport = useCallback(() => {
    exportProjectToFile(buildProjectData());
  }, [buildProjectData]);

  const doImport = useCallback(async () => {
    const data = await importProjectFromFile();
    if (data) {
      saveProject(data);
      projectIdRef.current = data.id;
      onLoadRef.current(data);
    }
    return data;
  }, []);

  const projectList = getProjectList();

  const refreshList = useCallback(() => {
    return getProjectList();
  }, []);

  const switchProject = useCallback((id: string) => {
    const data = loadProject(id);
    if (data) {
      projectIdRef.current = data.id;
      localStorage.setItem(CURRENT_KEY, data.id);
      onLoadRef.current(data);
    }
    return data;
  }, []);

  const createNewProject = useCallback(() => {
    const newId = generateId();
    projectIdRef.current = newId;
    const newData: ProjectData = {
      id: newId,
      name: "Novo Projeto",
      updatedAt: new Date().toISOString(),
      viewMode: "physical",
      viewport: { x: 0, y: 0, zoom: 1 },
      physicalNodes: [],
      physicalEdges: [],
      logicalNodes: [],
      logicalEdges: [],
      logicalContentByNodeId: {},
    };
    saveProject(newData);
    onLoadRef.current(newData);
    return newId;
  }, []);

  const deleteCurrentProject = useCallback(() => {
    const currentId = projectIdRef.current;
    if (!currentId) return null;
    deleteProject(currentId);
    const list = getProjectList();
    if (list.length > 0) {
      const data = loadProject(list[0].id);
      if (data) {
        projectIdRef.current = data.id;
        onLoadRef.current(data);
        return data.id;
      }
    }
    return createNewProject();
  }, [createNewProject]);

  return {
    projectId: projectIdRef.current,
    save,
    exportToFile: doExport,
    importFromFile: doImport,
    projectList,
    switchProject,
    createNewProject,
    deleteCurrentProject,
    refreshList,
  };
}
