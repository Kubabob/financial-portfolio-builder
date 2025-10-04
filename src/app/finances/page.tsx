'use client'

import { Input } from '@/components/ui/input'
import { useEffect, useState } from 'react'
import LinePlot from '@/components/ui/chart'
import { DateTimePicker } from '@/components/dateTimePicker'
import { formatDateForApi } from '@/lib/utils'

export default function Finances() {
    const [ticker, setTicker] = useState<string>('')
    const [data, setData] = useState<Record<string, unknown>[]>([])
    const [loading, setLoading] = useState(true)
    const [endDate, setEndDate] = useState<Date>(new Date())
    const [startDate, setStartDate] = useState<Date>(() => {
        const d = new Date()
        d.setMonth(d.getMonth() - 1)
        return d
    })

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
    }, [ticker, startDate, endDate])

    return (
        <>
            <h1 className="text-2xl font-bold mb-4 text-center">
                Financial Data for {ticker}
            </h1>
            <div className="flex justify-center items-start gap-6 mt-6">
                <div className="flex flex-col">
                    <label className="mb-2 text-sm font-medium h-5 flex items-center">
                        Ticker
                    </label>
                    <div className="h-10 flex items-center">
                        <Input
                            type="text"
                            value={ticker}
                            onChange={(e) => {
                                setTicker(e.target.value)
                                // handleFetchData
                            }}
                            className="h-full w-32"
                        />
                    </div>
                </div>

                <div className="flex flex-col">
                    <label className="mb-2 text-sm font-medium h-5 flex items-center">
                        Start Date
                    </label>
                    <div className="h-10">
                        <DateTimePicker
                            dateTime={startDate}
                            onChange={setStartDate}
                        />
                    </div>
                </div>

                <div className="flex flex-col">
                    <label className="mb-2 text-sm font-medium h-5 flex items-center">
                        End Date
                    </label>
                    <div className="h-10">
                        <DateTimePicker
                            dateTime={endDate}
                            onChange={setEndDate}
                        />
                    </div>
                </div>
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
