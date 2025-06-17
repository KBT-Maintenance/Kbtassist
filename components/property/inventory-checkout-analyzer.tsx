"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2Icon, SparklesIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateInventoryAnalysis } from "@/lib/actions" // Assuming this is a server action

interface InventoryCheckoutAnalyzerProps {
  propertyId: string
}

export function InventoryCheckoutAnalyzer({ propertyId }: InventoryCheckoutAnalyzerProps) {
  const [checkInReport, setCheckInReport] = useState("")
  const [checkOutReport, setCheckOutReport] = useState("")
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAnalysisResult(null)

    if (!checkInReport || !checkOutReport) {
      toast({
        title: "Missing Reports",
        description: "Please provide both check-in and check-out reports.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const { success, analysis, error } = await generateInventoryAnalysis(propertyId, checkInReport, checkOutReport)

      if (success && analysis) {
        setAnalysisResult(analysis)
        toast({
          title: "Analysis Complete",
          description: "Inventory comparison generated successfully.",
        })
      } else {
        toast({
          title: "Analysis Failed",
          description: error || "An unexpected error occurred during analysis.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error calling server action:", err)
      toast({
        title: "System Error",
        description: "Failed to connect to AI service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI Inventory Checkout Analyzer</CardTitle>
        <CardDescription>
          Compare check-in and check-out inventory reports to identify discrepancies and damages.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="check-in-report">Check-in Report</Label>
            <Textarea
              id="check-in-report"
              placeholder="Paste the full check-in inventory report here..."
              rows={8}
              value={checkInReport}
              onChange={(e) => setCheckInReport(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div>
            <Label htmlFor="check-out-report">Check-out Report</Label>
            <Textarea
              id="check-out-report"
              placeholder="Paste the full check-out inventory report here..."
              rows={8}
              value={checkOutReport}
              onChange={(e) => setCheckOutReport(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <SparklesIcon className="mr-2 h-4 w-4" /> Generate Analysis
              </>
            )}
          </Button>
        </form>

        {analysisResult && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">Analysis Result:</h3>
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="whitespace-pre-wrap text-sm">{analysisResult}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
