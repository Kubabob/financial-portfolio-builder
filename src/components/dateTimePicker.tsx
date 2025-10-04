'use client'

import { useState, useEffect } from 'react'
import { ChevronDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

type DateTimePickerProps = {
    dateTime?: Date
    onChange?: (date: Date) => void
}

export function DateTimePicker({ dateTime, onChange }: DateTimePickerProps) {
    const [open, setOpen] = useState(false)
    const [date, setDate] = useState<Date | undefined>(dateTime)
    const [time, setTime] = useState(
        dateTime
            ? `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime
                  .getMinutes()
                  .toString()
                  .padStart(2, '0')}:${dateTime
                  .getSeconds()
                  .toString()
                  .padStart(2, '0')}`
            : '00:00:00'
    )

    // Update internal state when props change
    useEffect(() => {
        setDate(dateTime)
        if (dateTime) {
            setTime(
                `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime
                    .getMinutes()
                    .toString()
                    .padStart(2, '0')}:${dateTime
                    .getSeconds()
                    .toString()
                    .padStart(2, '0')}`
            )
        }
    }, [dateTime])

    const handleDateChange = (newDate: Date | undefined) => {
        if (!newDate) return

        setDate(newDate)
        setOpen(false)

        if (onChange && time) {
            const [hours, minutes, seconds] = time.split(':').map(Number)
            const updatedDate = new Date(newDate)
            updatedDate.setHours(hours, minutes, seconds)
            onChange(updatedDate)
        }
    }

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTime = e.target.value
        setTime(newTime)

        if (onChange && date && newTime) {
            const [hours, minutes, seconds] = newTime.split(':').map(Number)
            const updatedDate = new Date(date)
            updatedDate.setHours(hours, minutes, seconds)
            onChange(updatedDate)
        }
    }

    return (
        <div className="flex items-center gap-2 h-full">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="h-full w-[110px] justify-between font-normal text-sm"
                    >
                        {date ? date.toLocaleDateString() : 'Select date'}
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        onSelect={handleDateChange}
                    />
                </PopoverContent>
            </Popover>

            <Input
                type="time"
                step="1"
                value={time}
                onChange={handleTimeChange}
                className="h-full w-[90px] text-sm bg-background [&::-webkit-calendar-picker-indicator]:hidden"
            />
        </div>
    )
}
