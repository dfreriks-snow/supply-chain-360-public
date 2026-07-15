// Data access layer. Two modes:
//   - Live (default): fetch from the Express server at /api/*
//   - Static (VITE_STATIC=1): read pre-baked JSON snapshots from <base>/data/*
//     and route the Cortex agent to VITE_AGENT_URL (a serverless function).
const STATIC = import.meta.env.VITE_STATIC === '1';
const AGENT_BASE = (import.meta.env.VITE_AGENT_URL ?? '').replace(/\/$/, '');
const DATA_BASE = `${import.meta.env.BASE_URL}data`;
const BASE = '/api';

/** Canonical filter key — MUST match filterKey() in scripts/export-static.mjs. */
function plantKey(plants: string[]): string {
  return [...plants].sort().join(',');
}

async function liveGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

const fileCache = new Map<string, Promise<any>>();
function loadStaticFile(file: string): Promise<any> {
  let p = fileCache.get(file);
  if (!p) {
    p = fetch(`${DATA_BASE}/${file}.json`).then((res) => {
      if (!res.ok) throw new Error(`Static data error: ${res.status} ${file}`);
      return res.json();
    });
    fileCache.set(file, p);
  }
  return p;
}

/** Plant-filtered endpoint: live /api call or a keyed static snapshot. */
async function getKeyed<T>(livePath: string, staticFile: string, plants: string[]): Promise<T> {
  if (STATIC) {
    const map = await loadStaticFile(staticFile);
    return (map[plantKey(plants)] ?? {}) as T;
  }
  return liveGet<T>(`${livePath}?plants=${encodeURIComponent(plants.join(','))}`);
}

/** Unfiltered endpoint: live /api call or a single static snapshot file. */
async function getSingle<T>(livePath: string, staticFile: string): Promise<T> {
  if (STATIC) return loadStaticFile(staticFile) as Promise<T>;
  return liveGet<T>(livePath);
}

export function fetchPlants(): Promise<string[]> {
  return getSingle<string[]>('/plants', 'plants');
}

export function fetchOverview(plants: string[]): Promise<any> {
  return getKeyed<any>('/overview', 'overview', plants);
}

export function fetchProduction(plants: string[]): Promise<any> {
  return getKeyed<any>('/production', 'production', plants);
}

export function fetchBom(plants: string[]): Promise<any> {
  return getKeyed<any>('/bom', 'bom', plants);
}

export function fetchInventory(plants: string[]): Promise<any> {
  return getKeyed<any>('/inventory', 'inventory', plants);
}

export function fetchLogistics(plants: string[]): Promise<any> {
  return getKeyed<any>('/logistics', 'logistics', plants);
}

export function fetchWorkCenter(plants: string[]): Promise<any> {
  return getKeyed<any>('/workcenter', 'workcenter', plants);
}

export function fetchProjects(plants: string[]): Promise<any> {
  return getKeyed<any>('/projects', 'projects', plants);
}

export function fetchSupplyChainMap(plants: string[]): Promise<any> {
  return getKeyed<any>('/geography', 'geography', plants);
}

export function fetchBdcProducts(): Promise<any> {
  return getSingle<any>('/data-products', 'data-products');
}

export function fetchOntology(): Promise<any> {
  return getSingle<any>('/ontology', 'ontology');
}

export function fetchOptimization(plants: string[]): Promise<any> {
  return getKeyed<any>('/optimization', 'optimization', plants);
}

export function fetchForecasting(plants: string[]): Promise<any> {
  return getKeyed<any>('/forecasting', 'forecasting', plants);
}

export async function fetchAnalyst(messages: { role: string; content: string }[]): Promise<any> {
  const base = STATIC ? AGENT_BASE : BASE;
  const res = await fetch(`${base}/analyst`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error(`API /analyst: ${res.status}`);
  return res.json();
}
