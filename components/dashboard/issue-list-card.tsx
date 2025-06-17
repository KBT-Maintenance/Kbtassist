import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface IssueItem {
  id: string
  description: string
  timeframe?: string
  status?: string
  count?: number
  date?: string
}

interface IssueListCardProps {
  title: string
  description?: string
  items: IssueItem[]
}

export function IssueListCard({ title, description, items }: IssueListCardProps) {
  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No items to display.</p>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      {item.timeframe && <p className="text-sm text-muted-foreground">{item.timeframe}</p>}
                      {item.date && <p className="text-sm text-muted-foreground">{item.date}</p>}
                    </div>
                    {item.status && <Badge variant="secondary">{item.status}</Badge>}
                    {item.count !== undefined && item.count > 0 && <Badge className="ml-2">{item.count}</Badge>}
                  </div>
                  {index < items.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
