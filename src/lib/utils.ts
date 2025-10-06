import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function randomRGBColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
}

export function backgroundRGBColor(RGBColor: string) {
    return RGBColor.replace("rgb", "rgba").replace(")", ", 0.5)");
}

export const formatDateForApi = (date: Date): string => {
    return date.toISOString();
};
