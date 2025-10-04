'use client'

import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import LinePlot from '@/components/ui/chart'

export default function FinancesTicker() {
    const [data, setData] = useState<Record<string, unknown>[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch(
                'http://localhost:3000/finances/AAPL?start=2020-01-01T00:00:00Z&end=2020-01-10T00:00:00Z'
            )
            const result = await response.json()
            setData(result)
            setLoading(false)
        }

        fetchData()
    }, [])

    if (loading) {
        return 'Loading...'
    }
    return <LinePlot data={data} />
}
