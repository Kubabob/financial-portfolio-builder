'use client'

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

import { randomRGBColor, backgroundRGBColor } from '@/lib/utils'

import { useEffect } from 'react'

type LinePlotProps = {
    data: Array<Record<string, unknown>>
    width?: number
    height?: number
    marginTop?: number
    marginRight?: number
    marginBottom?: number
    marginLeft?: number
}

export default function LinePlot({
    data,
    width = 640,
    height = 400,
    marginTop = 20,
    marginRight = 20,
    marginBottom = 20,
    marginLeft = 20,
}: LinePlotProps): React.ReactElement {
    type Row = { timestamp: number | string; [key: string]: unknown }

    const labels = (data as Row[]).map((row) =>
        new Date(
            Number.parseInt(String(row.timestamp), 10) * 1000
        ).toISOString()
    )

    const datasetsLabels =
        data[0] && typeof data[0] === 'object' ? Object.keys(data[0]) : []
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Chart.js Line Chart',
            },
            zoom: {
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true,
                    },
                    drag: {
                        enabled: true,
                    },
                    mode: 'x' as const,
                },
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                position: 'nearest' as const,
            },
            interaction: {
                mode: 'index',
                intersect: false,
                position: 'nearest',
            },
        },
    }
    // }
    useEffect(() => {
        if (typeof window !== 'undefined') {
            import('chartjs-plugin-zoom').then((plugin) => {
                ChartJS.register(plugin.default)
            })
        }
    }, [])
    ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend
    )

    const chartData = {
        labels,
        datasets: datasetsLabels
            .filter((label) => !['timestamp'].includes(label))
            .map((label) => {
                const borderColor = randomRGBColor()
                const backgroundColor = backgroundRGBColor(borderColor)

                return {
                    label: label,
                    data: data.map((row) => {
                        return row[label]
                    }),
                    borderColor: borderColor,
                    backgroundColor: backgroundColor,
                }
            }),
    }
    return <Line options={options} data={chartData} />
}
