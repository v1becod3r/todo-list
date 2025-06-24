"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trash2, Plus, Calendar, ChevronDown, ChevronRight } from "lucide-react"

interface Subtask {
  id: number
  text: string
  completed: boolean
}

interface Task {
  id: number
  text: string
  completed: boolean
  subtasks: Subtask[]
  expanded: boolean
}

interface DayTasks {
  [date: string]: Task[]
}

export default function Component() {
  const [allTasks, setAllTasks] = useState<DayTasks>({})
  const [newTask, setNewTask] = useState("")
  const [newSubtask, setNewSubtask] = useState<{ [taskId: number]: string }>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState("")
  const [editingType, setEditingType] = useState<"task" | "subtask">("task")
  const [activeTab, setActiveTab] = useState("today")

  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayKey = today.toISOString().split("T")[0]
  const tomorrowKey = tomorrow.toISOString().split("T")[0]

  const todayFormatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const tomorrowFormatted = tomorrow.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const currentTasks = allTasks[activeTab === "today" ? todayKey : tomorrowKey] || []

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("daily-tasks-v2")
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks)
        // Ensure expanded property exists, default to true for existing tasks
        const cleanedTasks: DayTasks = {}
        Object.keys(parsedTasks).forEach((dateKey) => {
          cleanedTasks[dateKey] = parsedTasks[dateKey].map((task: any) => ({
            id: task.id,
            text: task.text,
            completed: task.completed,
            subtasks: task.subtasks || [],
            expanded: task.expanded !== undefined ? task.expanded : true,
          }))
        })
        setAllTasks(cleanedTasks)
      } catch (error) {
        console.error("Error loading tasks:", error)
      }
    }
  }, [])

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem("daily-tasks-v2", JSON.stringify(allTasks))
  }, [allTasks])

  const updateTasks = (dateKey: string, updatedTasks: Task[]) => {
    setAllTasks((prev) => ({
      ...prev,
      [dateKey]: updatedTasks,
    }))
  }

  const addTask = () => {
    if (newTask.trim() !== "") {
      const dateKey = activeTab === "today" ? todayKey : tomorrowKey
      const currentDateTasks = allTasks[dateKey] || []

      const newTaskObj: Task = {
        id: Date.now(),
        text: newTask.trim(),
        completed: false,
        subtasks: [],
        expanded: true,
      }

      updateTasks(dateKey, [...currentDateTasks, newTaskObj])
      setNewTask("")
    }
  }

  const toggleTask = (id: number) => {
    const dateKey = activeTab === "today" ? todayKey : tomorrowKey
    const updatedTasks = currentTasks.map((task) => {
      if (task.id === id) {
        const newCompleted = !task.completed
        // If marking task as complete, complete all subtasks
        // If marking as incomplete, keep subtasks as they are
        const updatedSubtasks = newCompleted
          ? task.subtasks.map((subtask) => ({ ...subtask, completed: true }))
          : task.subtasks

        return { ...task, completed: newCompleted, subtasks: updatedSubtasks }
      }
      return task
    })
    updateTasks(dateKey, updatedTasks)
  }

  const toggleSubtask = (taskId: number, subtaskId: number) => {
    const dateKey = activeTab === "today" ? todayKey : tomorrowKey
    const updatedTasks = currentTasks.map((task) => {
      if (task.id === taskId) {
        const updatedSubtasks = task.subtasks.map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask,
        )

        // Check if all subtasks are completed to auto-complete the main task
        const allSubtasksCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((subtask) => subtask.completed)

        return {
          ...task,
          subtasks: updatedSubtasks,
          completed: allSubtasksCompleted,
        }
      }
      return task
    })
    updateTasks(dateKey, updatedTasks)
  }

  const deleteTask = (id: number) => {
    const dateKey = activeTab === "today" ? todayKey : tomorrowKey
    updateTasks(
      dateKey,
      currentTasks.filter((task) => task.id !== id),
    )
  }

  const deleteSubtask = (taskId: number, subtaskId: number) => {
    const dateKey = activeTab === "today" ? todayKey : tomorrowKey
    const updatedTasks = currentTasks.map((task) => {
      if (task.id === taskId) {
        const updatedSubtasks = task.subtasks.filter((subtask) => subtask.id !== subtaskId)

        // Recheck if all remaining subtasks are completed
        const allSubtasksCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((subtask) => subtask.completed)

        return {
          ...task,
          subtasks: updatedSubtasks,
          completed: updatedSubtasks.length === 0 ? task.completed : allSubtasksCompleted,
        }
      }
      return task
    })
    updateTasks(dateKey, updatedTasks)
  }

  const toggleTaskExpansion = (id: number) => {
    const dateKey = activeTab === "today" ? todayKey : tomorrowKey
    const updatedTasks = currentTasks.map((task) => (task.id === id ? { ...task, expanded: !task.expanded } : task))
    updateTasks(dateKey, updatedTasks)
  }

  const addSubtask = (taskId: number) => {
    const subtaskText = newSubtask[taskId]
    if (subtaskText && subtaskText.trim() !== "") {
      const dateKey = activeTab === "today" ? todayKey : tomorrowKey
      const updatedTasks = currentTasks.map((task) => {
        if (task.id === taskId) {
          const newSubtaskObj: Subtask = {
            id: Date.now(),
            text: subtaskText.trim(),
            completed: false,
          }
          return {
            ...task,
            subtasks: [...task.subtasks, newSubtaskObj],
            expanded: true, // Auto-expand when adding subtask
          }
        }
        return task
      })
      updateTasks(dateKey, updatedTasks)
      setNewSubtask((prev) => ({ ...prev, [taskId]: "" }))
    }
  }

  const startEditing = (id: number, text: string, type: "task" | "subtask" = "task") => {
    setEditingId(id)
    setEditingText(text)
    setEditingType(type)
  }

  const saveEdit = () => {
    if (editingText.trim() !== "" && editingId !== null) {
      const dateKey = activeTab === "today" ? todayKey : tomorrowKey

      if (editingType === "task") {
        const updatedTasks = currentTasks.map((task) =>
          task.id === editingId ? { ...task, text: editingText.trim() } : task,
        )
        updateTasks(dateKey, updatedTasks)
      } else {
        const updatedTasks = currentTasks.map((task) => ({
          ...task,
          subtasks: task.subtasks.map((subtask) =>
            subtask.id === editingId ? { ...subtask, text: editingText.trim() } : subtask,
          ),
        }))
        updateTasks(dateKey, updatedTasks)
      }
    }
    setEditingId(null)
    setEditingText("")
    setEditingType("task")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingText("")
    setEditingType("task")
  }

  const getTaskStats = (tasks: Task[]) => {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.completed).length
    const totalSubtasks = tasks.reduce((acc, task) => acc + task.subtasks.length, 0)
    const completedSubtasks = tasks.reduce(
      (acc, task) => acc + task.subtasks.filter((subtask) => subtask.completed).length,
      0,
    )

    return {
      totalTasks,
      completedTasks,
      totalSubtasks,
      completedSubtasks,
      totalItems: totalTasks + totalSubtasks,
      completedItems: completedTasks + completedSubtasks,
    }
  }

  const stats = getTaskStats(currentTasks)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardContent className="space-y-6 py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="today" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Today
                </TabsTrigger>
                <TabsTrigger value="tomorrow" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Tomorrow
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Add new task */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder={`Add a new task for ${activeTab}...`}
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addTask()
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={addTask} size="icon">
                  <Plus className="w-4 h-4" />
                  <span className="sr-only">Add task</span>
                </Button>
              </div>
            </div>

            {/* Task list */}
            <div className="space-y-6">
              {currentTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tasks yet. Add one above to get started!</p>
                </div>
              ) : (
                currentTasks.map((task) => (
                  <div key={task.id} className="border rounded-lg bg-background shadow-sm">
                    {/* Main Task */}
                    <div
                      className="flex items-center gap-4 py-4 pr-4 transition-all bg-muted/20"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleTaskExpansion(task.id)}
                        className="text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
                        title={task.expanded ? "Hide subtasks" : "Show subtasks"}
                      >
                        {task.expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </Button>
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id)}
                      />

                      {editingId === task.id && editingType === "task" ? (
                        <Input
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              saveEdit()
                            } else if (e.key === "Escape") {
                              cancelEdit()
                            }
                          }}
                          onBlur={saveEdit}
                          className="flex-1"
                          autoFocus
                        />
                      ) : (
                        <label
                          htmlFor={`task-${task.id}`}
                          className={`flex-1 flex items-center cursor-pointer font-medium ${
                            task.completed ? "line-through text-muted-foreground" : "text-foreground"
                          }`}
                          onDoubleClick={() => startEditing(task.id, task.text, "task")}
                          title="Double-click to edit"
                        >
                          {task.text}
                          {task.subtasks.length > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground font-normal">
                              ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
                            </span>
                          )}
                        </label>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTask(task.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Delete task</span>
                      </Button>
                    </div>

                    {/* Subtasks section - Show when expanded */}
                    {task.expanded && (
                      <div className="px-4 pb-4">
                        {/* Existing subtasks */}
                        {task.subtasks.length > 0 && (
                          <div className="space-y-3 mb-4">
                            {task.subtasks.map((subtask) => (
                              <div
                                key={subtask.id}
                                className="flex items-center gap-3 p-3 ml-6 rounded-md border transition-all bg-background/50 border-border/50"
                              >
                                <Checkbox
                                  id={`subtask-${subtask.id}`}
                                  checked={subtask.completed}
                                  onCheckedChange={() => toggleSubtask(task.id, subtask.id)}
                                />

                                {editingId === subtask.id && editingType === "subtask" ? (
                                  <Input
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        saveEdit()
                                      } else if (e.key === "Escape") {
                                        cancelEdit()
                                      }
                                    }}
                                    onBlur={saveEdit}
                                    className="flex-1 h-8"
                                    autoFocus
                                  />
                                ) : (
                                  <label
                                    htmlFor={`subtask-${subtask.id}`}
                                    className={`flex-1 cursor-pointer text-sm ${
                                      subtask.completed ? "line-through text-muted-foreground" : "text-foreground"
                                    }`}
                                    onDoubleClick={() => startEditing(subtask.id, subtask.text, "subtask")}
                                    title="Double-click to edit"
                                  >
                                    {subtask.text}
                                  </label>
                                )}

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteSubtask(task.id, subtask.id)}
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span className="sr-only">Delete subtask</span>
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add subtask input - Show when expanded */}
                        <div className="flex gap-2 ml-6">
                          <Input
                            type="text"
                            placeholder="Add a subtask..."
                            value={newSubtask[task.id] || ""}
                            onChange={(e) => setNewSubtask((prev) => ({ ...prev, [task.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                addSubtask(task.id)
                              }
                            }}
                            className="flex-1 h-8 text-sm"
                          />
                          <Button onClick={() => addSubtask(task.id)} size="icon" className="h-8 w-8">
                            <Plus className="w-3 h-3" />
                            <span className="sr-only">Add subtask</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Progress indicator */}
            {stats.totalItems > 0 && (
              <div className="mt-8">
                <div className="flex justify-between text-sm text-muted-foreground mb-3">
                  <span>Progress</span>
                  <span>{Math.round((stats.completedTasks / stats.totalTasks) * 100)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(stats.completedTasks / stats.totalTasks) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
