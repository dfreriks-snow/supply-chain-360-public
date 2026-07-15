import { cn } from '@/lib/utils';
import {
  Factory,
  CheckCircle2,
  Timer,
  TrendingUp,
  Gauge,
  Trash2,
  Truck,
  RotateCw,
  type LucideIcon,
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  icon?: LucideIcon;
  accent?: string;
  className?: string;
}

export default function MetricCard({ title, value, icon: Icon, accent, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-5 shadow-sm transition-transform hover:scale-[1.02]',
        accent ?? 'border-sf-primary/30 bg-gradient-to-br from-blue-50 to-sky-50',
        className
      )}
    >
      {Icon && (
        <div className="absolute -right-2 -top-2 opacity-10">
          <Icon className="h-16 w-16" />
        </div>
      )}
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-extrabold text-gray-900">{value}</p>
    </div>
  );
}

export { Factory, CheckCircle2, Timer, TrendingUp, Gauge, Trash2, Truck, RotateCw };
