import type { CSSProperties } from 'react';
import type { NormalizedChartSpec } from '@/lib/charts/normalize';

interface ChartRendererProps {
    spec: NormalizedChartSpec;
    primaryColor: string;
    textColor: string;
    secondaryColor: string;
    surfaceColor: string;
    className?: string;
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#22c55e'];

export default function ChartRenderer({
    spec,
    primaryColor,
    textColor,
    secondaryColor,
    surfaceColor,
    className,
}: ChartRendererProps) {
    const series = spec.series[0];
    const maxValue = Math.max(spec.formatting.scale.max, 1);

    const wrapperClass = className ? `w-full h-full ${className}` : 'w-full h-full';

    if (spec.type === 'pie') {
        const total = Math.max(1, series.values.reduce((sum, value) => sum + value, 0));
        const segments = series.values.reduce<string[]>((acc, value, index) => {
            const size = (value / total) * 360;
            const color = PIE_COLORS[index % PIE_COLORS.length];
            const start = acc.length === 0
                ? 0
                : Number(acc[acc.length - 1].split(' ').at(-1)?.replace('deg', '') || 0);
            const end = start + size;
            acc.push(`${color} ${start}deg ${end}deg`);
            return acc;
        }, []);

        return (
            <div className={`${wrapperClass} flex items-center gap-4`}>
                <div className="h-full aspect-square max-h-[220px] rounded-full border" style={{ background: `conic-gradient(${segments.join(', ')})`, borderColor: `${primaryColor}30` }} />
                {spec.formatting.showLegend && (
                    <div className="flex-1 space-y-1.5 overflow-hidden">
                        {spec.categories.map((category, index) => (
                            <div key={`${category}-${index}`} className="flex items-center gap-2 text-xs">
                                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                                <span className="truncate" style={{ color: textColor }}>{category}</span>
                                <span className="ml-auto" style={{ color: secondaryColor }}>{series.values[index].toFixed(0)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (spec.type === 'line') {
        const width = 100;
        const height = 100;
        const points = series.values.map((value, index) => {
            const x = spec.categories.length > 1 ? (index / (spec.categories.length - 1)) * width : width / 2;
            const y = height - (Math.max(0, value) / maxValue) * height;
            return `${x},${y}`;
        });

        return (
            <div className={`${wrapperClass} flex flex-col`}>
                <div className="flex-1 rounded-md border p-2" style={{ borderColor: `${primaryColor}25`, background: surfaceColor }}>
                    <svg viewBox="0 0 100 100" className="h-full w-full">
                        <polyline fill="none" stroke={primaryColor} strokeWidth="2" points={points.join(' ')} />
                        {points.map((point, index) => {
                            const [x, y] = point.split(',');
                            return <circle key={`${point}-${index}`} cx={x} cy={y} r="1.8" fill={primaryColor} />;
                        })}
                    </svg>
                </div>
                <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(spec.categories.length, 6)}, minmax(0, 1fr))` }}>
                    {spec.categories.map((category, index) => (
                        <div
                            key={`${category}-${index}`}
                            className="text-[10px] leading-tight break-words text-center"
                            style={{ color: secondaryColor, transform: `rotate(${spec.formatting.axisLabelRotation}deg)` as CSSProperties['transform'] }}
                        >
                            {category}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`${wrapperClass} flex items-end gap-2`}>
            {spec.categories.map((category, index) => (
                <div key={`${category}-${index}`} className="flex-1 flex flex-col items-center justify-end gap-1.5">
                    <div className="text-[10px]" style={{ color: secondaryColor }}>{series.values[index].toFixed(0)}</div>
                    <div
                        className="w-full rounded-t-sm"
                        style={{
                            height: `${Math.max((series.values[index] / maxValue) * 100, 5)}%`,
                            background: primaryColor,
                            opacity: 0.9,
                        }}
                    />
                    <div className="text-[10px] leading-tight break-words text-center" style={{ color: secondaryColor }}>{category}</div>
                </div>
            ))}
        </div>
    );
}
