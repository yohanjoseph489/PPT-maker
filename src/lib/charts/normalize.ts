export type ChartType = 'bar' | 'line' | 'pie';

export interface ChartSeries {
    name: string;
    values: number[];
}

export interface ChartFormattingOptions {
    axisLabelRotation: number;
    showLegend: boolean;
    scale: {
        mode: 'auto' | 'zeroBased';
        min: number;
        max: number;
    };
}

export interface NormalizedChartSpec {
    type: ChartType;
    categories: string[];
    series: ChartSeries[];
    formatting: ChartFormattingOptions;
}

export interface RawChartInput {
    type?: ChartType;
    categories?: string[];
    labels?: string[];
    series?: Array<Partial<ChartSeries>>;
    values?: number[];
    formatting?: Partial<ChartFormattingOptions>;
}

const MAX_POINTS = 12;
const DEFAULT_SERIES_NAME = 'Series 1';

const clampFiniteNumber = (value: unknown) => {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, numeric);
};

const normalizeCategory = (value: unknown, index: number) => {
    const text = typeof value === 'string' ? value.trim() : '';
    return text || `Item ${index + 1}`;
};

const dedupe = (values: string[]) => values.map((value, index) => {
    const firstIndex = values.indexOf(value);
    if (firstIndex === index) return value;
    return `${value} ${index - firstIndex + 1}`;
});

export function normalizeChartSpec(input: RawChartInput): NormalizedChartSpec {
    const type: ChartType = input.type === 'line' || input.type === 'pie' ? input.type : 'bar';
    const inputSeries = input.series?.length
        ? input.series
        : [{ name: DEFAULT_SERIES_NAME, values: input.values || [] }];

    const initialCategoryLength = Math.max(
        input.categories?.length || 0,
        input.labels?.length || 0,
        ...inputSeries.map((series) => series.values?.length || 0),
        2,
    );
    const categoryCount = Math.min(MAX_POINTS, initialCategoryLength);

    const rawCategories = input.categories?.length ? input.categories : input.labels;
    const categories = dedupe(
        Array.from({ length: categoryCount }, (_, index) => normalizeCategory(rawCategories?.[index], index)),
    );

    const series = inputSeries
        .slice(0, 6)
        .map((rawSeries, seriesIndex) => {
            const name = rawSeries.name?.trim() || `${DEFAULT_SERIES_NAME}${seriesIndex > 0 ? ` ${seriesIndex + 1}` : ''}`;
            const normalizedValues = Array.from({ length: categoryCount }, (_, categoryIndex) =>
                clampFiniteNumber(rawSeries.values?.[categoryIndex]),
            );
            return { name, values: normalizedValues };
        });

    const safeSeries = series.length ? series : [{ name: DEFAULT_SERIES_NAME, values: Array(categoryCount).fill(0) }];
    const allValues = safeSeries.flatMap((item) => item.values);
    const maxValue = Math.max(1, ...allValues);
    const axisLabelRotation = input.formatting?.axisLabelRotation ?? (categories.some((value) => value.length > 10) || categories.length > 6 ? 45 : 0);
    const showLegend = input.formatting?.showLegend ?? (type === 'pie' || safeSeries.length > 1);

    return {
        type,
        categories,
        series: safeSeries,
        formatting: {
            axisLabelRotation,
            showLegend,
            scale: {
                mode: input.formatting?.scale?.mode || 'zeroBased',
                min: input.formatting?.scale?.min ?? 0,
                max: input.formatting?.scale?.max ?? maxValue,
            },
        },
    };
}
