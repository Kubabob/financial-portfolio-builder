'use client'

import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import LinePlot from '@/components/ui/chart'
import { DateTimePicker } from '@/components/dateTimePicker'

export default function FinancesTicker() {
    const params = useParams()
    const ticker = (params.ticker as string) || 'AAPL'

    const [data, setData] = useState<Record<string, unknown>[]>([])
    const [loading, setLoading] = useState(true)
    const [endDate, setEndDate] = useState<Date>(
        // new Date('2020-01-10T00:00:00Z')
        new Date()
    )
    const [startDate, setStartDate] = useState<Date>(
        // new Date('2020-01-01T00:00:00Z')
        () => {
            const d = new Date()
            d.setMonth(d.getMonth() - 1)
            return d
        }
    )

    const formatDateForApi = (date: Date): string => {
        return date.toISOString()
    }

    const fetchData = async (ticker: string, start: Date, end: Date) => {
        setLoading(true)
        try {
            const response = await fetch(
                `http://localhost:3000/finances/${ticker}?start=${formatDateForApi(
                    start
                )}&end=${formatDateForApi(end)}`
            )
            const result = await response.json()
            setData(result)
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData(ticker, startDate, endDate)
    }, [ticker])

    const handleFetchData = () => {
        fetchData(ticker, startDate, endDate)
    }

    return (
        <>
            <h1 className="text-2xl font-bold mb-4 text-center">
                Financial Data for {ticker}
            </h1>
            <div className="flex justify-center items-center gap-4">
                <div className="flex flex-col items-center">
                    <label className="mb-1 text-xl font-bold">start</label>
                    <DateTimePicker
                        dateTime={startDate}
                        onChange={setStartDate}
                    />
                </div>
                <div className="flex flex-col items-center">
                    <label className="mb-1 text-xl font-bold">end</label>
                    <DateTimePicker dateTime={endDate} onChange={setEndDate} />
                </div>
            </div>

            <div className="mt-4 flex justify-center">
                <Button onClick={handleFetchData}>Fetch Data</Button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    Loading...
                </div>
            ) : (
                <div className="mt-4">
                    <LinePlot data={data} />
                </div>
            )}
        </>
    )
}
