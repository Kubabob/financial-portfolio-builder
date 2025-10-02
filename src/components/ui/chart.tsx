import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';

interface ChartProps {
    data: Array<Record<string, unknown>>;
    title?: string;
    xAxisKey?: string;
    excludeKeys?: string[];
}

type ChartDatum = Record<string, number | Date | undefined>;

const COLORS: string[] = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7300',
    '#00ff00', '#ff00ff', '#00ffff', '#ffff00'
];

export function InteractiveChart({
    data,
    title = "Interactive Chart",
    xAxisKey = "timestamp",
    excludeKeys = ["timestamp", "adjclose"]
}: ChartProps): React.ReactElement {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({});

    // Extract all numeric keys from data
    const availableKeys = useMemo<string[]>(() => {
        if (!data || data.length === 0) return [];

        const firstItem = data[0];
        return Object.keys(firstItem).filter(key => {
            if (excludeKeys.includes(key)) return false;

            const value = firstItem[key as keyof typeof firstItem];
            return typeof value === 'number' || !isNaN(Number(value as unknown));
        });
    }, [data, excludeKeys]);

    // Initialize visible series when keys change
    useEffect(() => {
        const initialVisibility: Record<string, boolean> = {};
        availableKeys.forEach(key => {
            initialVisibility[key] = true;
        });
        setVisibleSeries(initialVisibility);
    }, [availableKeys]);

    // Toggle series visibility
    const toggleSeries = (key: string): void => {
        setVisibleSeries(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Format data for chart
    const chartData = useMemo<ChartDatum[]>(() => {
        return data.map(item => {
            const formattedItem: ChartDatum = {};

            // Handle x-axis (timestamp/date)
            if (item[xAxisKey]) {
                // item[xAxisKey] may be number or string; coerce to number then Date
                formattedItem[xAxisKey] = new Date(Number(item[xAxisKey]) * 1000);
            }

            // Add all numeric values
            availableKeys.forEach(key => {
                const raw = item[key as keyof typeof item];
                formattedItem[key] = Number(raw);
            });

            return formattedItem;
        });
    }, [data, availableKeys, xAxisKey]);

    // D3 chart rendering
    useEffect(() => {
        if (!chartData.length || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create scales
        const xScale: d3.ScaleTime<number, number> = d3.scaleTime()
            .domain(d3.extent(chartData, d => d[xAxisKey] as Date) as [Date, Date])
            .range([0, width]);

        // Only include values from visible series for y-axis scaling
        const allValues: number[] = availableKeys
            .filter(key => visibleSeries[key]) // Only consider visible series
            .flatMap(key =>
                chartData.map(d => d[key] as number).filter(v => !isNaN(v))
            );

        const yScale: d3.ScaleLinear<number, number> = d3.scaleLinear()
            .domain(allValues.length > 0 ? d3.extent(allValues) as [number, number] : [0, 1])
            .range([height, 0]);

        // Create axes
        const xAxis = d3.axisBottom(xScale).tickFormat((d: Date | d3.NumberValue, i: number) => {
            const date = d instanceof Date ? d : new Date(+d);
            return d3.timeFormat("%m/%d")(date);
        });
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis as any);

        g.append("g")
            .call(d3.axisLeft(yScale));

        // Create line generator (typed for ChartDatum)
        const line: d3.Line<ChartDatum> = d3.line<ChartDatum>()
            .x(d => xScale(d[xAxisKey] as Date))
            .y(() => 0) // placeholder, actual y used per-series below
            .curve(d3.curveMonotoneX);

        // Create tooltip
        const tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "white")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("font-size", "12px");

        // Draw lines for each visible series
        availableKeys.forEach((key, index) => {
            if (!visibleSeries[key]) return;

            const validData: ChartDatum[] = chartData.filter(d => !isNaN(d[key] as number));

            const path = g.append("path")
                .datum(validData)
                .attr("fill", "none")
                .attr("stroke", COLORS[index % COLORS.length])
                .attr("stroke-width", 2)
                // use per-series y accessor when building the 'd' attribute
                .attr("d", d3.line<ChartDatum>()
                    .x(d => xScale(d[xAxisKey] as Date))
                    .y(d => yScale(d[key] as number))
                    .curve(d3.curveMonotoneX)(validData) ?? null as any);

            // Add dots for hover interaction
            g.selectAll(`.dot-${key}`)
                .data(validData)
                .enter().append("circle")
                .attr("class", `dot-${key}`)
                .attr("cx", d => xScale(d[xAxisKey] as Date))
                .attr("cy", d => yScale(d[key] as number))
                .attr("r", 3)
                .attr("fill", COLORS[index % COLORS.length])
                .style("opacity", 0)
                .on("mouseover", function(event: MouseEvent, d: ChartDatum) {
                    d3.select(this).style("opacity", 1);
                    tooltip.transition().duration(200).style("opacity", .9);
                    tooltip.html(`
                        <strong>${key.charAt(0).toUpperCase() + key.slice(1)}</strong><br/>
                        Date: ${(d[xAxisKey] as Date).toLocaleDateString()}<br/>
                        Value: ${(d[key] as number).toFixed(2)}
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    d3.select(this).style("opacity", 0);
                    tooltip.transition().duration(500).style("opacity", 0);
                });
        });

        // Cleanup tooltip on unmount
        return () => {
            d3.select("body").selectAll(".tooltip").remove();
        };

    }, [chartData, visibleSeries, availableKeys, xAxisKey]);

    if (!data || data.length === 0) {
        return <div className="p-4 text-center">No data available</div>;
    }

    return (
        <div className="w-full p-4">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>

            {/* Toggle Controls */}
            <div className="mb-4 flex flex-wrap gap-2">
                {availableKeys.map((key, index) => (
                    <button
                        key={key}
                        onClick={() => toggleSeries(key)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            visibleSeries[key]
                                ? 'text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        style={{
                            backgroundColor: visibleSeries[key] ? COLORS[index % COLORS.length] : undefined
                        }}
                    >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                    </button>
                ))}
            </div>

            {/* Chart */}
            <div className="w-full overflow-x-auto">
                <svg
                    ref={svgRef}
                    width="800"
                    height="400"
                    className="border border-gray-200"
                />
            </div>
        </div>
    );
}

// Hook for fetching chart data
export function useChartData(ticker: string, start?: string, end?: string): {
    data: Array<Record<string, unknown>>;
    loading: boolean;
    error: string | null;
} {
    const [data, setData] = useState<Array<Record<string, unknown>>>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!ticker) return;

        const fetchData = async (): Promise<void> => {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams();
                if (start) params.append('start', start);
                if (end) params.append('end', end);

                const response = await fetch(`http://localhost:3000/finances/${ticker}?${params}`);
                if (!response.ok) throw new Error('Failed to fetch data');

                const result = await response.json();
                setData(result as Array<Record<string, unknown>>);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [ticker, start, end]);

    return { data, loading, error };
}
