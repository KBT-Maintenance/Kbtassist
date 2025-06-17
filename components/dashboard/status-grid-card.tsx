import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatusGridCardProps {
  title: string
  description?: string
  data: number[][]
  colors: string[] // Array of Tailwind CSS background color classes
}

export function StatusGridCard({ title, description, data, colors }: StatusGridCardProps) {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-1 h-48">
          {data.map((row, rowIndex) =>
            row.map((value, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={cn(
                  "flex items-center justify-center rounded-sm text-white text-xs font-bold",
                  colors[colIndex % colors.length], // Cycle through provided colors
                  value === 0 && "bg-gray-200 dark:bg-gray-700 text-gray-500", // Grey out if value is 0
                )}
                title={`Value: ${value}`}
              >
                {value > 0 ? value : ""}
              </div>
            )),
          )}
        </div>
      </CardContent>
    </Card>
  )
}
