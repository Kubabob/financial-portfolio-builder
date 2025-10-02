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
    const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

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

        const margin = { top: 20, right: 30, bottom: 40, left: 60 };
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
            .filter(key => visibleSeries[key])
            .flatMap(key =>
                chartData.map(d => d[key] as number).filter(v => !isNaN(v))
            );

        const yScale: d3.ScaleLinear<number, number> = d3.scaleLinear()
            .domain(allValues.length > 0 ? d3.extent(allValues) as [number, number] : [0, 1])
            .range([height, 0])
            .nice();

        // Provide a tick formatter on the scale so d3.axisLeft(yScale) will pick it up.
        // Use scientific notation for very large/small numbers, otherwise use a readable fixed format.
        (yScale as any).tickFormat = (count: number) => {
            const sci = d3.format(".2e");    // scientific notation
            const fixed = d3.format(",.2f"); // comma separated with 2 decimals

            return (d: number) => {
            const abs = Math.abs(d);
            // Use scientific notation for very large or very small numbers
            if (d !== 0 && (abs >= 1e6 || abs < 1e-3)) return sci(d);
            return fixed(d);
            };
        };

        // Create clip path for zooming
        svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

        // Create axes groups
        const xAxisGroup = g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`);

        const yAxisGroup = g.append("g")
            .attr("class", "y-axis");

        const xAxis = d3.axisBottom(xScale).tickFormat((d: Date | d3.NumberValue) => {
            const date = d instanceof Date ? d : new Date(+d);
            return d3.timeFormat("%m/%d")(date);
        });

        xAxisGroup.call(xAxis as any);
        yAxisGroup.call(d3.axisLeft(yScale).ticks(8));

        // Chart content group (clipped)
        const chartContent = g.append("g")
            .attr("clip-path", "url(#clip)");

        // Create tooltip
        const tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any> = d3.select("body")
            .append("div")
            .attr("class", "chart-tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.9)")
            .style("color", "white")
            .style("padding", "12px")
            .style("border-radius", "6px")
            .style("pointer-events", "none")
            .style("font-size", "12px")
            .style("z-index", "1000")
            .style("box-shadow", "0 4px 6px rgba(0,0,0,0.3)");

        // Crosshair lines
        const crosshairX = g.append("line")
            .attr("class", "crosshair-x")
            .style("stroke", "#999")
            .style("stroke-width", 1)
            .style("stroke-dasharray", "3,3")
            .style("opacity", 0);

        const crosshairY = g.append("line")
            .attr("class", "crosshair-y")
            .style("stroke", "#999")
            .style("stroke-width", 1)
            .style("stroke-dasharray", "3,3")
            .style("opacity", 0);

        // Draw lines and dots for each visible series
        const seriesGroups: Array<{ key: string; index: number; group: d3.Selection<SVGGElement, unknown, null, undefined> }> = [];

        availableKeys.forEach((key, index) => {
            if (!visibleSeries[key]) return;

            const validData: ChartDatum[] = chartData.filter(d => !isNaN(d[key] as number));
            const seriesGroup = chartContent.append("g").attr("class", `series-${key}`);

            // Draw line
            seriesGroup.append("path")
                .datum(validData)
                .attr("class", `line-${key}`)
                .attr("fill", "none")
                .attr("stroke", COLORS[index % COLORS.length])
                .attr("stroke-width", 2)
                .attr("d", d3.line<ChartDatum>()
                    .x(d => xScale(d[xAxisKey] as Date))
                    .y(d => yScale(d[key] as number))
                    .curve(d3.curveMonotoneX)(validData) ?? null as any);

            // Draw dots
            seriesGroup.selectAll(`.dot-${key}`)
                .data(validData)
                .enter().append("circle")
                .attr("class", `dot-${key}`)
                .attr("cx", d => xScale(d[xAxisKey] as Date))
                .attr("cy", d => yScale(d[key] as number))
                .attr("r", 4)
                .attr("fill", COLORS[index % COLORS.length])
                .style("opacity", 0);

            seriesGroups.push({ key, index, group: seriesGroup });
        });

        // Overlay for mouse events
        const overlay = g.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all");

        // Mouse move handler for interactive features
        overlay.on("mousemove", function(event: MouseEvent) {
            const [mouseX, mouseY] = d3.pointer(event);

            // Update crosshair
            crosshairX
                .attr("x1", mouseX)
                .attr("x2", mouseX)
                .attr("y1", 0)
                .attr("y2", height)
                .style("opacity", 1);

            crosshairY
                .attr("x1", 0)
                .attr("x2", width)
                .attr("y1", mouseY)
                .attr("y2", mouseY)
                .style("opacity", 1);

            // Find closest data point
            const x0 = xScale.invert(mouseX);
            const bisect = d3.bisector<ChartDatum, Date>((d: ChartDatum) => d[xAxisKey] as Date).left;
            const index = bisect(chartData, x0, 1);
            const d0 = chartData[index - 1];
            const d1 = chartData[index];

            if (!d0 || !d1) return;

            const closestData = x0.getTime() - (d0[xAxisKey] as Date).getTime() >
                               (d1[xAxisKey] as Date).getTime() - x0.getTime() ? d1 : d0;

            // Highlight dots at closest point
            seriesGroups.forEach(({ key, index: seriesIndex, group }) => {
                group.selectAll(`.dot-${key}`)
                    .style("opacity", (d: any) =>
                        d[xAxisKey].getTime() === (closestData[xAxisKey] as Date).getTime() ? 1 : 0
                    );
            });

            // Build tooltip content
            let tooltipContent = `<strong>${(closestData[xAxisKey] as Date).toLocaleDateString()}</strong><br/>`;
            seriesGroups.forEach(({ key, index: seriesIndex }) => {
                const value = closestData[key] as number;
                if (!isNaN(value)) {
                    tooltipContent += `<span style="color: ${COLORS[seriesIndex % COLORS.length]}">●</span> `;
                    tooltipContent += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value.toFixed(2)}<br/>`;
                }
            });

            tooltip
                .html(tooltipContent)
                .style("opacity", 0.95)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");
        });

        overlay.on("mouseout", function() {
            crosshairX.style("opacity", 0);
            crosshairY.style("opacity", 0);
            tooltip.style("opacity", 0);
            seriesGroups.forEach(({ key, group }) => {
                group.selectAll(`.dot-${key}`).style("opacity", 0);
            });
        });

        // Zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([1, 20])
            .translateExtent([[0, 0], [width, height]])
            .extent([[0, 0], [width, height]])
            .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
                const newXScale = event.transform.rescaleX(xScale);

                // Update axes
                xAxisGroup.call(d3.axisBottom(newXScale).tickFormat((d: Date | d3.NumberValue) => {
                    const date = d instanceof Date ? d : new Date(+d);
                    return d3.timeFormat("%m/%d")(date);
                }) as any);

                // Update lines and dots
                seriesGroups.forEach(({ key, group }) => {
                    group.select(`.line-${key}`)
                        .attr("d", d3.line<ChartDatum>()
                            .x(d => newXScale(d[xAxisKey] as Date))
                            .y(d => yScale(d[key] as number))
                            .curve(d3.curveMonotoneX) as any);

                    group.selectAll(`.dot-${key}`)
                        .attr("cx", (d: any) => newXScale(d[xAxisKey] as Date));
                });
            });

        svg.call(zoom);
        zoomRef.current = zoom;

        // Cleanup
        return () => {
            d3.select("body").selectAll(".chart-tooltip").remove();
        };

    }, [chartData, visibleSeries, availableKeys, xAxisKey]);

    // Reset zoom function
    const resetZoom = (): void => {
        if (svgRef.current && zoomRef.current) {
            d3.select(svgRef.current)
                .transition()
                .duration(750)
                .call(zoomRef.current.transform as any, d3.zoomIdentity);
        }
    };

    if (!data || data.length === 0) {
        return <div className="p-4 text-center">No data available</div>;
    }

    return (
        <div className="w-full p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{title}</h3>
                <button
                    onClick={resetZoom}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                >
                    Reset Zoom
                </button>
            </div>

            {/* Toggle Controls */}
            <div className="mb-4 flex flex-wrap gap-2">
                {availableKeys.map((key, index) => (
                    <button
                        key={key}
                        onClick={() => toggleSeries(key)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${
                            visibleSeries[key]
                                ? 'text-white shadow-md'
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
                    className="border border-gray-200 rounded cursor-move"
                />
                <div className="mt-2 text-xs text-gray-500 text-center">
                    Drag to pan • Scroll to zoom • Hover for details
                </div>
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
