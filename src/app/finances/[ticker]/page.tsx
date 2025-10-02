'use client'

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

export default function FinancesTicker() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch("http://localhost:3000/finances/AAPL?start=2020-01-01T00:00:00Z&end=2020-01-10T00:00:00Z");
            const result = await response.json()
            setData(result)
            setLoading(false)
        };

        fetchData()
    }, []);
    // let header: string[];
    const sample = Array.isArray(data) ? data[0] : data;
    const header: string[] = sample && typeof sample === "object"
        ? Object.keys(sample)
        : [];

    if (loading) {
        return "Loading...";
    }
    return (
        // <p>{content}</p>
        <>
            <p>hi</p>
            {header.map((key) => <p key={key}>{key}</p>)}
            {/* {header.map((key) => {
                <Checkbox id={key}>
                    <Label htmlFor={key}>{key}</Label>
                </Checkbox>
            })} */}
        </>
    );
}
