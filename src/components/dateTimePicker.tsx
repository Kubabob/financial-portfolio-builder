'use client'

import * as React from 'react'
import { ChevronDownIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(dateTime)
    const [time, setTime] = React.useState(
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
    React.useEffect(() => {
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
        <div className="flex gap-4">
            <div className="flex flex-col gap-3">
                <Label htmlFor="date-picker" className="px-1">
                    Date
                </Label>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            id="date-picker"
                            className="w-32 justify-between font-normal"
                        >
                            {date ? date.toLocaleDateString() : 'Select date'}
                            <ChevronDownIcon />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                    >
                        <Calendar
                            mode="single"
                            selected={date}
                            captionLayout="dropdown"
                            onSelect={handleDateChange}
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex flex-col gap-3">
                <Label htmlFor="time-picker" className="px-1">
                    Time
                </Label>
                <Input
                    type="time"
                    id="time-picker"
                    step="1"
                    value={time}
                    onChange={handleTimeChange}
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
            </div>
        </div>
    )
}
