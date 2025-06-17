"use client"

import type React from "react"
import { useState, useActionState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2Icon, PlusCircleIcon, Trash2Icon, DownloadIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { addInventoryItem, getInventoryItems, updateInventoryItem, deleteInventoryItem } from "@/lib/actions" // Assuming these are server actions
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

interface InventoryManagerProps {
  propertyId: string
}

interface InventoryItem {
  id: string
  name: string
  condition: string
  quantity: number
  location: string
  lastChecked: Date
}

export function InventoryManager({ propertyId }: InventoryManagerProps) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [itemName, setItemName] = useState("")
  const [condition, setCondition] = useState("")
  const [quantity, setQuantity] = useState("")
  const [location, setLocation] = useState("")
  const [lastChecked, setLastChecked] = useState<Date | undefined>(new Date())
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  const { toast } = useToast()

  const [addState, addAction, addIsPending] = useActionState(addInventoryItem, null)
  const [updateState, updateAction, updateIsPending] = useActionState(updateInventoryItem, null)
  const [deleteState, deleteAction, deleteIsPending] = useActionState(deleteInventoryItem, null)

  const isPending = addIsPending || updateIsPending || deleteIsPending

  const fetchItems = async () => {
    const { success, items: fetchedItems, error } = await getInventoryItems(propertyId)
    if (success && fetchedItems) {
      setItems(
        fetchedItems.map((item: any) => ({
          ...item,
          lastChecked: new Date(item.lastChecked),
        })),
      )
    } else if (error) {
      toast({
        title: "Error",
        description: `Failed to load inventory items: ${error}`,
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchItems()
  }, [propertyId]) // Re-fetch when propertyId changes

  useEffect(() => {
    if (addState?.success && !addIsPending) {
      toast({ title: "Success", description: addState.message })
      setItemName("")
      setCondition("")
      setQuantity("")
      setLocation("")
      setLastChecked(new Date())
      fetchItems()
    } else if (addState?.error && !addIsPending) {
      toast({ title: "Error", description: addState.error, variant: "destructive" })
    }
  }, [addState, addIsPending, toast])

  useEffect(() => {
    if (updateState?.success && !updateIsPending) {
      toast({ title: "Success", description: updateState.message })
      setEditingItem(null)
      setItemName("")
      setCondition("")
      setQuantity("")
      setLocation("")
      setLastChecked(new Date())
      fetchItems()
    } else if (updateState?.error && !updateIsPending) {
      toast({ title: "Error", description: updateState.error, variant: "destructive" })
    }
  }, [updateState, updateIsPending, toast])

  useEffect(() => {
    if (deleteState?.success && !deleteIsPending) {
      toast({ title: "Success", description: deleteState.message })
      fetchItems()
    } else if (deleteState?.error && !deleteIsPending) {
      toast({ title: "Error", description: deleteState.error, variant: "destructive" })
    }
  }, [deleteState, deleteIsPending, toast])

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName || !condition || !quantity || !location || !lastChecked) {
      toast({ title: "Missing Fields", description: "Please fill all fields.", variant: "destructive" })
      return
    }
    addAction({
      propertyId,
      name: itemName,
      condition,
      quantity: Number.parseInt(quantity),
      location,
      lastChecked: lastChecked.toISOString(),
    })
  }

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem || !itemName || !condition || !quantity || !location || !lastChecked) {
      toast({ title: "Missing Fields", description: "Please fill all fields.", variant: "destructive" })
      return
    }
    updateAction(editingItem.id, {
      name: itemName,
      condition,
      quantity: Number.parseInt(quantity),
      location,
      lastChecked: lastChecked.toISOString(),
    })
  }

  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteAction(itemId)
    }
  }

  const startEditing = (item: InventoryItem) => {
    setEditingItem(item)
    setItemName(item.name)
    setCondition(item.condition)
    setQuantity(item.quantity.toString())
    setLocation(item.location)
    setLastChecked(item.lastChecked)
  }

  const cancelEditing = () => {
    setEditingItem(null)
    setItemName("")
    setCondition("")
    setQuantity("")
    setLocation("")
    setLastChecked(new Date())
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{editingItem ? "Edit Inventory Item" : "Add New Inventory Item"}</CardTitle>
          <CardDescription>
            {editingItem ? "Modify details of the selected item." : "Add a new item to this property's inventory."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="space-y-4">
            <div>
              <Label htmlFor="itemName">Item Name</Label>
              <Input
                id="itemName"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Sofa"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Textarea
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="Good, minor wear and tear"
                rows={3}
                required
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                min="1"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Living Room"
                required
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor="lastChecked">Last Checked</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !lastChecked && "text-muted-foreground",
                    )}
                    disabled={isPending}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {lastChecked ? format(lastChecked, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={lastChecked}
                    onSelect={setLastChecked}
                    initialFocus
                    disabled={isPending}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : editingItem ? (
                  "Update Item"
                ) : (
                  <>
                    <PlusCircleIcon className="mr-2 h-4 w-4" /> Add Item
                  </>
                )}
              </Button>
              {editingItem && (
                <Button type="button" variant="outline" onClick={cancelEditing} disabled={isPending}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Inventory</CardTitle>
          <CardDescription>All items currently recorded for this property.</CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No inventory items added yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{format(new Date(item.lastChecked), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => startEditing(item)} disabled={isPending}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
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
          <Button variant="outline" className="mt-4 w-full" disabled={isPending}>
            <DownloadIcon className="mr-2 h-4 w-4" /> Export Inventory
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
