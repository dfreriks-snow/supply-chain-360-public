import { useState, useMemo } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { fetchBdcProducts } from '@/lib/api';
import MetricCard, { Factory, CheckCircle2, Timer } from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import DataTable from '@/components/DataTable';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CsnEntity {
  name: string;
  label: string;
  fields: number;
  keys: number;
  category: string;
}

interface Product {
  DisplayName: string;
  TechnicalName: string;
  ShortText: string;
  Products: string;
  _csn: any;
}

function resolveLabel(label: any, i18n: Record<string, any>): string {
  if (!label || typeof label !== 'string') return '';
  if (label.startsWith('{i18n>') && label.endsWith('}')) {
    const key = label.slice(6, -1);
    const en = i18n?.en;
    if (en && en[key]) return en[key];
    for (const langLabels of Object.values(i18n ?? {})) {
      if (typeof langLabels === 'object' && langLabels && key in (langLabels as any)) {
        return (langLabels as any)[key];
      }
    }
    return key;
  }
  return label;
}

function extractEntities(csn: any): CsnEntity[] {
  if (!csn || !csn.definitions) return [];
  const i18n = csn.i18n ?? {};
  const entities: CsnEntity[] = [];
  for (const [name, defn] of Object.entries(csn.definitions)) {
    const d = defn as any;
    if (!d || d.kind !== 'entity') continue;
    const label = resolveLabel(d['@EndUserText.label'], i18n);
    const elems = d.elements ?? {};
    const fields = Object.values(elems).filter(
      (e: any) => e && typeof e === 'object' && e.type !== 'cds.Association' && e.type !== 'cds.Composition'
    ).length;
    const keys = Object.values(elems).filter((e: any) => e && typeof e === 'object' && e.key).length;
    const category = d['@Analytics.dataCategory'] ?? '';
    const catStr = typeof category === 'object' ? (category['#'] ?? '') : String(category);
    entities.push({ name, label, fields, keys, category: catStr });
  }
  return entities.sort((a, b) => a.name.localeCompare(b.name));
}

export default function DataProducts() {
  const { data, loading, error } = useQuery<Product[]>(() => fetchBdcProducts(), []);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const products = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.map((p) => ({
      display_name: p.DisplayName,
      technical_name: p.TechnicalName,
      short_text: p.ShortText ?? '',
      source_system: p.Products ?? 'S/4HANA Cloud PE',
      entities: extractEntities(p._csn),
      entity_count: extractEntities(p._csn).length,
    }));
  }, [data]);

  const totalEntities = products.reduce((s, p) => s + p.entity_count, 0);

  function toggleExpand(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-gradient-to-br from-sky-100 to-cyan-50" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-700 shadow-sm"><strong>Error:</strong> {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-5">
        <MetricCard title="BDC Data Products" value={products.length.toLocaleString()} icon={Factory} accent="border-cyan-400/50 bg-gradient-to-br from-cyan-50 via-white to-cyan-100" />
        <MetricCard title="CDS Views / Entities" value={totalEntities.toLocaleString()} icon={CheckCircle2} accent="border-violet-400/50 bg-gradient-to-br from-violet-50 via-white to-violet-100" />
        <MetricCard title="Source System" value="S/4HANA Cloud PE" icon={Timer} accent="border-amber-400/50 bg-gradient-to-br from-amber-50 via-white to-amber-100" />
      </div>

      {/* Summary Table */}
      <ChartCard title="SAP BDC Supply Chain Data Products" subtitle="All available data products for the Supply Chain line of business">
        <DataTable
          columns={[
            { key: 'display_name', label: 'Data Product' },
            { key: 'technical_name', label: 'Technical Name' },
            { key: 'entity_count', label: 'CDS Views' },
            { key: 'short_text', label: 'Description' },
          ]}
          data={products}
        />
      </ChartCard>

      {/* Expandable Entity Details */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900">CDS Views by Data Product</h3>
        {products.map((product) => {
          const isOpen = expanded.has(product.technical_name);
          return (
            <div
              key={product.technical_name}
              className="rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <button
                onClick={() => toggleExpand(product.technical_name)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <span className="font-semibold text-gray-900">{product.display_name}</span>
                  <span className="ml-3 rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-700">
                    {product.entity_count} entities
                  </span>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </button>
              {isOpen && product.entities.length > 0 && (
                <div className="border-t border-gray-100 px-5 py-4">
                  <DataTable
                    columns={[
                      { key: 'name', label: 'CDS View' },
                      { key: 'label', label: 'Label' },
                      { key: 'category', label: 'Category' },
                      { key: 'fields', label: 'Fields' },
                      { key: 'keys', label: 'Keys' },
                    ]}
                    data={product.entities}
                  />
                </div>
              )}
              {isOpen && product.entities.length === 0 && (
                <div className="border-t border-gray-100 px-5 py-4 text-sm text-gray-500">
                  No CSN file available for this product.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
