// "use client";

// import { useState } from "react";
// import { useParams } from "next/navigation";
// import { Calendar } from "@/components/ui/calendar";
// import { Button } from "@/components/ui/button";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { CalendarIcon } from "lucide-react";
// import { format } from "date-fns";
// import { InteractiveChart, useChartData } from "@/components/ui/chart";

// export default function TickerPage() {
//   const params = useParams();
//   const ticker = params?.ticker as string;

//   const [startDate, setStartDate] = useState<Date | undefined>(
//     new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
//   );
//   const [endDate, setEndDate] = useState<Date | undefined>(new Date());

//   // Convert dates to ISO 8601 format (RFC3339) for API
//   const startTimestamp = startDate
//     ? startDate.toISOString()
//     : undefined;
//   const endTimestamp = endDate
//     ? endDate.toISOString()
//     : undefined;

//   const { data, loading, error } = useChartData(
//     ticker,
//     startTimestamp,
//     endTimestamp
//   );

//   return (
//     <div className="container mx-auto p-6 space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-3xl font-bold">
//           {ticker?.toUpperCase()} Stock Data
//         </h1>
//       </div>

//       {/* Date Selectors */}
//       <div className="flex gap-4 items-center">
//         <div className="flex flex-col gap-2">
//           <label className="text-sm font-medium">Start Date</label>
//           <Popover>
//             <PopoverTrigger asChild>
//               <Button
//                 variant="outline"
//                 className="w-[240px] justify-start text-left font-normal"
//               >
//                 <CalendarIcon className="mr-2 h-4 w-4" />
//                 {startDate ? format(startDate, "PPP") : "Pick a date"}
//               </Button>
//             </PopoverTrigger>
//             <PopoverContent className="w-auto p-0" align="start">
//               <Calendar
//                 mode="single"
//                 selected={startDate}
//                 onSelect={setStartDate}
//                 initialFocus
//               />
//             </PopoverContent>
//           </Popover>
//         </div>

//         <div className="flex flex-col gap-2">
//           <label className="text-sm font-medium">End Date</label>
//           <Popover>
//             <PopoverTrigger asChild>
//               <Button
//                 variant="outline"
//                 className="w-[240px] justify-start text-left font-normal"
//               >
//                 <CalendarIcon className="mr-2 h-4 w-4" />
//                 {endDate ? format(endDate, "PPP") : "Pick a date"}
//               </Button>
//             </PopoverTrigger>
//             <PopoverContent className="w-auto p-0" align="start">
//               <Calendar
//                 mode="single"
//                 selected={endDate}
//                 onSelect={setEndDate}
//                 initialFocus
//               />
//             </PopoverContent>
//           </Popover>
//         </div>
//       </div>

//       {/* Chart Display */}
//       <div className="border rounded-lg p-4 bg-white shadow-sm">
//         {loading && (
//           <div className="text-center py-12">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
//             <p className="mt-4 text-gray-600">Loading data...</p>
//           </div>
//         )}

//         {error && (
//           <div className="text-center py-12 text-red-600">
//             <p>Error: {error}</p>
//           </div>
//         )}

//         {!loading && !error && data.length > 0 && (
//           <InteractiveChart
//             data={data}
//             title={`${ticker?.toUpperCase()} Price History`}
//             xAxisKey="timestamp"
//             excludeKeys={["timestamp", "adjclose"]}
//           />
//         )}

//         {!loading && !error && data.length === 0 && (
//           <div className="text-center py-12 text-gray-600">
//             <p>No data available for the selected date range.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
