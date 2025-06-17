"use client"

import { Badge } from "@/components/ui/badge"

import type React from "react"
import { useState, useActionState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2Icon, PlusCircleIcon, Trash2Icon, DownloadIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  addComplianceDocument,
  getComplianceDocuments,
  updateComplianceDocument,
  deleteComplianceDocument,
} from "@/lib/actions" // Assuming these are server actions
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { uploadFile, deleteFile } from "@vercel/blob/client" // Import Vercel Blob functions

interface ComplianceDocumentManagerProps {
  propertyId: string
}

interface ComplianceDocument {
  id: string
  name: string
  type: string
  expiryDate: Date | null
  status: string
  fileUrl: string | null
  fileName: string | null
}

export function ComplianceDocumentManager({ propertyId }: ComplianceDocumentManagerProps) {
  const [documents, setDocuments] = useState<ComplianceDocument[]>([])
  const [docName, setDocName] = useState("")
  const [docType, setDocType] = useState("")
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined)
  const [status, setStatus] = useState("Valid") // Default status
  const [file, setFile] = useState<File | null>(null)
  const [editingDoc, setEditingDoc] = useState<ComplianceDocument | null>(null)

  const { toast } = useToast()

  const [addState, addAction, addIsPending] = useActionState(addComplianceDocument, null)
  const [updateState, updateAction, updateIsPending] = useActionState(updateComplianceDocument, null)
  const [deleteState, deleteAction, deleteIsPending] = useActionState(deleteComplianceDocument, null)

  const isPending = addIsPending || updateIsPending || deleteIsPending

  const fetchDocuments = async () => {
    const { success, documents: fetchedDocuments, error } = await getComplianceDocuments(propertyId)
    if (success && fetchedDocuments) {
      setDocuments(
        fetchedDocuments.map((doc: any) => ({
          ...doc,
          expiryDate: doc.expiryDate ? new Date(doc.expiryDate) : null,
        })),
      )
    } else if (error) {
      toast({
        title: "Error",
        description: `Failed to load documents: ${error}`,
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [propertyId])

  useEffect(() => {
    if (addState?.success && !addIsPending) {
      toast({ title: "Success", description: addState.message })
      resetForm()
      fetchDocuments()
    } else if (addState?.error && !addIsPending) {
      toast({ title: "Error", description: addState.error, variant: "destructive" })
    }
  }, [addState, addIsPending, toast])

  useEffect(() => {
    if (updateState?.success && !updateIsPending) {
      toast({ title: "Success", description: updateState.message })
      resetForm()
      fetchDocuments()
    } else if (updateState?.error && !updateIsPending) {
      toast({ title: "Error", description: updateState.error, variant: "destructive" })
    }
  }, [updateState, updateIsPending, toast])

  useEffect(() => {
    if (deleteState?.success && !deleteIsPending) {
      toast({ title: "Success", description: deleteState.message })
      fetchDocuments()
    } else if (deleteState?.error && !deleteIsPending) {
      toast({ title: "Error", description: deleteState.error, variant: "destructive" })
    }
  }, [deleteState, deleteIsPending, toast])

  const resetForm = () => {
    setEditingDoc(null)
    setDocName("")
    setDocType("")
    setExpiryDate(undefined)
    setStatus("Valid")
    setFile(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    } else {
      setFile(null)
    }
  }

  const handleAddOrUpdateDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docName || !docType || !status) {
      toast({ title: "Missing Fields", description: "Please fill all required fields.", variant: "destructive" })
      return
    }

    let uploadedFileUrl: string | null = editingDoc?.fileUrl || null
    let uploadedFileName: string | null = editingDoc?.fileName || null

    if (file) {
      try {
        // If editing and a new file is uploaded, delete the old one first
        if (editingDoc?.fileUrl) {
          await deleteFile(editingDoc.fileUrl)
        }
        const newBlob = await uploadFile(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload/compliance-document", // Your API route for Vercel Blob
        })
        uploadedFileUrl = newBlob.url
        uploadedFileName = newBlob.pathname.split("/").pop() || newBlob.pathname // Extract filename
      } catch (uploadError: any) {
        toast({
          title: "Upload Error",
          description: `Failed to upload file: ${uploadError.message || "Unknown error"}`,
          variant: "destructive",
        })
        return
      }
    } else if (editingDoc && !editingDoc.fileUrl && !file) {
      // If editing and no file was previously attached and no new file is uploaded
      uploadedFileUrl = null
      uploadedFileName = null
    }

    const documentData = {
      name: docName,
      type: docType,
      expiryDate: expiryDate ? expiryDate.toISOString() : null,
      status,
      fileUrl: uploadedFileUrl,
      fileName: uploadedFileName,
    }

    if (editingDoc) {
      updateAction(editingDoc.id, documentData)
    } else {
      addAction(propertyId, documentData)
    }
  }

  const handleDeleteDocument = async (doc: ComplianceDocument) => {
    if (window.confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      try {
        if (doc.fileUrl) {
          await deleteFile(doc.fileUrl)
        }
        deleteAction(doc.id)
      } catch (deleteError: any) {
        toast({
          title: "Deletion Error",
          description: `Failed to delete file from storage: ${deleteError.message || "Unknown error"}`,
          variant: "destructive",
        })
      }
    }
  }

  const startEditing = (doc: ComplianceDocument) => {
    setEditingDoc(doc)
    setDocName(doc.name)
    setDocType(doc.type)
    setExpiryDate(doc.expiryDate || undefined)
    setStatus(doc.status)
    setFile(null) // Clear file input when editing
  }

  const getStatusBadgeVariant = (docStatus: string) => {
    switch (docStatus) {
      case "Valid":
        return "success"
      case "Expiring Soon":
        return "secondary"
      case "Expired":
        return "destructive"
      case "Missing":
        return "outline"
      default:
        return "secondary"
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{editingDoc ? "Edit Document" : "Add New Document"}</CardTitle>
          <CardDescription>
            {editingDoc ? "Modify details of the selected document." : "Add a new compliance document."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddOrUpdateDocument} className="space-y-4">
            <div>
              <Label htmlFor="docName">Document Name</Label>
              <Input
                id="docName"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Gas Safety Certificate"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="docType">Document Type</Label>
              <Input
                id="docType"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                placeholder="Certificate, Lease, Report"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !expiryDate && "text-muted-foreground")}
                    disabled={isPending}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    initialFocus
                    disabled={isPending}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={setStatus} value={status} disabled={isPending}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Valid">Valid</SelectItem>
                  <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Missing">Missing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="file">Upload File (PDF, JPG, PNG)</Label>
              <Input id="file" type="file" onChange={handleFileChange} disabled={isPending} />
              {editingDoc?.fileName && !file && (
                <p className="text-sm text-muted-foreground mt-1">
                  Current file: {editingDoc.fileName}{" "}
                  <a href={editingDoc.fileUrl || "#"} target="_blank" rel="noopener noreferrer" className="underline">
                    (View)
                  </a>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : editingDoc ? (
                  "Update Document"
                ) : (
                  <>
                    <PlusCircleIcon className="mr-2 h-4 w-4" /> Add Document
                  </>
                )}
              </Button>
              {editingDoc && (
                <Button type="button" variant="outline" onClick={resetForm} disabled={isPending}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Documents</CardTitle>
          <CardDescription>All compliance-related documents for this property.</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No compliance documents added yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>{doc.type}</TableCell>
                    <TableCell>{doc.expiryDate ? format(doc.expiryDate, "dd MMM yyyy") : "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(doc.status)}>{doc.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {doc.fileUrl && (
                        <Button variant="outline" size="sm" asChild className="mr-2">
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <DownloadIcon className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => startEditing(doc)} disabled={isPending}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc)}
                        className="ml-2"
                        disabled={isPending}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
