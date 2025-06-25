"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Plus, ChevronDown, ChevronRight, GripVertical, Calendar, Clock } from "lucide-react"

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
  board: "today" | "longterm"
}

interface TaskBoards {
  today: Task[]
  longterm: Task[]
}

export default function Component() {
  const [taskBoards, setTaskBoards] = useState<TaskBoards>({
    today: [],
    longterm: [],
  })
  const [newTask, setNewTask] = useState<{ today: string; longterm: string }>({
    today: "",
    longterm: "",
  })
  const [newSubtask, setNewSubtask] = useState<{ [taskId: number]: string }>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState("")
  const [editingType, setEditingType] = useState<"task" | "subtask">("task")
  const [draggedTask, setDraggedTask] = useState<{ id: number; board: "today" | "longterm" } | null>(null)
  const [dragOverBoard, setDragOverBoard] = useState<"today" | "longterm" | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("daily-tasks-boards")
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks)
        if (parsedTasks.today && parsedTasks.longterm) {
          setTaskBoards({
            today: parsedTasks.today.map((task: any) => ({
              id: task.id,
              text: task.text,
              completed: task.completed,
              subtasks: task.subtasks || [],
              expanded: task.expanded !== undefined ? task.expanded : true,
              board: "today",
            })),
            longterm: parsedTasks.longterm.map((task: any) => ({
              id: task.id,
              text: task.text,
              completed: task.completed,
              subtasks: task.subtasks || [],
              expanded: task.expanded !== undefined ? task.expanded : true,
              board: "longterm",
            })),
          })
        }
      } catch (error) {
        console.error("Error loading tasks:", error)
      }
    } else {
      // Try to migrate from old single-board format
      const oldSavedTasks = localStorage.getItem("daily-tasks-simple")
      if (oldSavedTasks) {
        try {
          const parsedTasks = JSON.parse(oldSavedTasks)
          setTaskBoards({
            today: parsedTasks.map((task: any) => ({
              id: task.id,
              text: task.text,
              completed: task.completed,
              subtasks: task.subtasks || [],
              expanded: task.expanded !== undefined ? task.expanded : true,
              board: "today",
            })),
            longterm: [],
          })
          localStorage.removeItem("daily-tasks-simple")
        } catch (error) {
          console.error("Error migrating old tasks:", error)
        }
      }
    }
  }, [])

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem("daily-tasks-boards", JSON.stringify(taskBoards))
  }, [taskBoards])

  const addTask = (board: "today" | "longterm") => {
    if (newTask[board].trim() !== "") {
      const newTaskObj: Task = {
        id: Date.now(),
        text: newTask[board].trim(),
        completed: false,
        subtasks: [],
        expanded: true,
        board,
      }
      setTaskBoards((prev) => ({
        ...prev,
        [board]: [...prev[board], newTaskObj],
      }))
      setNewTask((prev) => ({ ...prev, [board]: "" }))
    }
  }

  const toggleTask = (id: number, board: "today" | "longterm") => {
    const updatedTasks = taskBoards[board].map((task) => {
      if (task.id === id) {
        const newCompleted = !task.completed
        const updatedSubtasks = task.subtasks.map((subtask) => ({
          ...subtask,
          completed: newCompleted
        }))
        return { ...task, completed: newCompleted, subtasks: updatedSubtasks }
      }
      return task
    })
    setTaskBoards((prev) => ({ ...prev, [board]: updatedTasks }))
  }

  const toggleSubtask = (taskId: number, subtaskId: number, board: "today" | "longterm") => {
    const updatedTasks = taskBoards[board].map((task) => {
      if (task.id === taskId) {
        const updatedSubtasks = task.subtasks.map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask,
        )
        const allSubtasksCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((subtask) => subtask.completed)
        return {
          ...task,
          subtasks: updatedSubtasks,
          completed: allSubtasksCompleted,
        }
      }
      return task
    })
    setTaskBoards((prev) => ({ ...prev, [board]: updatedTasks }))
  }

  const deleteTask = (id: number, board: "today" | "longterm") => {
    setTaskBoards((prev) => ({
      ...prev,
      [board]: prev[board].filter((task) => task.id !== id),
    }))
  }

  const deleteSubtask = (taskId: number, subtaskId: number, board: "today" | "longterm") => {
    const updatedTasks = taskBoards[board].map((task) => {
      if (task.id === taskId) {
        const updatedSubtasks = task.subtasks.filter((subtask) => subtask.id !== subtaskId)
        const allSubtasksCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((subtask) => subtask.completed)
        return {
          ...task,
          subtasks: updatedSubtasks,
          completed: updatedSubtasks.length === 0 ? task.completed : allSubtasksCompleted,
        }
      }
      return task
    })
    setTaskBoards((prev) => ({ ...prev, [board]: updatedTasks }))
  }

  const toggleTaskExpansion = (id: number, board: "today" | "longterm") => {
    const updatedTasks = taskBoards[board].map((task) =>
      task.id === id ? { ...task, expanded: !task.expanded } : task,
    )
    setTaskBoards((prev) => ({ ...prev, [board]: updatedTasks }))
  }

  const addSubtask = (taskId: number, board: "today" | "longterm") => {
    const subtaskText = newSubtask[taskId]
    if (subtaskText && subtaskText.trim() !== "") {
      const updatedTasks = taskBoards[board].map((task) => {
        if (task.id === taskId) {
          const newSubtaskObj: Subtask = {
            id: Date.now(),
            text: subtaskText.trim(),
            completed: false,
          }
          return {
            ...task,
            subtasks: [...task.subtasks, newSubtaskObj],
            expanded: true,
          }
        }
        return task
      })
      setTaskBoards((prev) => ({ ...prev, [board]: updatedTasks }))
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
      const updateTasksInBoard = (tasks: Task[]) => {
        if (editingType === "task") {
          return tasks.map((task) => (task.id === editingId ? { ...task, text: editingText.trim() } : task))
        } else {
          return tasks.map((task) => ({
            ...task,
            subtasks: task.subtasks.map((subtask) =>
              subtask.id === editingId ? { ...subtask, text: editingText.trim() } : subtask,
            ),
          }))
        }
      }

      setTaskBoards((prev) => ({
        today: updateTasksInBoard(prev.today),
        longterm: updateTasksInBoard(prev.longterm),
      }))
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

  const handleDragStart = (e: React.DragEvent, taskId: number, board: "today" | "longterm") => {
    setDraggedTask({ id: taskId, board })
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, board: "today" | "longterm", index?: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverBoard(board)
    if (index !== undefined) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverBoard(null)
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, targetBoard: "today" | "longterm", dropIndex?: number) => {
    e.preventDefault()
    e.stopPropagation() // Prevent event bubbling

    if (!draggedTask) return

    const { id: draggedTaskId, board: sourceBoard } = draggedTask
    const draggedTaskObj = taskBoards[sourceBoard].find((task) => task.id === draggedTaskId)

    if (!draggedTaskObj) return

    if (sourceBoard === targetBoard) {
      // Reordering within the same board
      if (dropIndex === undefined) return

      const draggedIndex = taskBoards[sourceBoard].findIndex((task) => task.id === draggedTaskId)
      if (draggedIndex === -1 || draggedIndex === dropIndex) return

      setTaskBoards((prev) => {
        const newTasks = [...prev[sourceBoard]]
        const [draggedItem] = newTasks.splice(draggedIndex, 1)
        newTasks.splice(dropIndex, 0, draggedItem)
        return { ...prev, [sourceBoard]: newTasks }
      })
    } else {
      // Moving between boards
      const updatedTask = { ...draggedTaskObj, board: targetBoard }

      setTaskBoards((prev) => {
        const newBoards = { ...prev }

        // Remove from source board
        newBoards[sourceBoard] = prev[sourceBoard].filter((task) => task.id !== draggedTaskId)

        // Add to target board
        if (dropIndex !== undefined) {
          const targetTasks = [...prev[targetBoard]]
          targetTasks.splice(dropIndex, 0, updatedTask)
          newBoards[targetBoard] = targetTasks
        } else {
          newBoards[targetBoard] = [...prev[targetBoard], updatedTask]
        }

        return newBoards
      })
    }

    setDraggedTask(null)
    setDragOverBoard(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverBoard(null)
    setDragOverIndex(null)
  }

  const renderTaskBoard = (board: "today" | "longterm", title: string, bgColor: string) => {
    const tasks = taskBoards[board]
    const stats = getTaskStats(tasks)

    return (
      <Card className={`flex flex-col shadow-lg border-border/50 ${bgColor} backdrop-blur-sm ${dragOverBoard === board ? "ring-2 ring-primary/50" : ""} transition-all duration-200 hover:shadow-xl`}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            {title}
            <span className="text-sm font-normal text-muted-foreground">({tasks.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent
          className="flex flex-col justify-between space-y-4 flex-1"
          onDragOver={(e) => handleDragOver(e, board)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, board)}
        >
          <div className="space-y-4 h-full">
            {/* Add new task */}
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Add new task"
                value={newTask[board]}
                onChange={(e) => setNewTask((prev) => ({ ...prev, [board]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addTask(board)
                  }
                }}
                className="flex-1 bg-background/70 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/50"
              />
              <Button
                onClick={() => addTask(board)}
                size="icon"
                className="bg-primary/90 hover:bg-primary text-primary-foreground transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="sr-only">Add task</span>
              </Button>
            </div>

            {/* Task list */}
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No tasks yet</p>
                </div>
              ) : (
                tasks.map((task, index) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id, board)}
                    onDragOver={(e) => handleDragOver(e, board, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, board, index)}
                    onDragEnd={handleDragEnd}
                    className={`border rounded-lg bg-slate-50 shadow-sm transition-all duration-200 hover:bg-slate-50/80 ${draggedTask?.id === task.id ? "opacity-30 scale-95" : ""
                      } ${dragOverIndex === index && dragOverBoard === board ? "border-primary/50 border-2 transform translate-y-1" : "border-border/50"} cursor-move`}
                  >
                    {/* Main Task */}
                    <div className="flex items-center gap-3 py-4 pr-4 transition-all rounded-t-lg">
                      <div className="text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing transition-colors">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleTaskExpansion(task.id, board)}
                        className="text-muted-foreground/70 hover:bg-background/50 hover:text-foreground h-6 w-6 transition-colors"
                        title={task.expanded ? "Hide subtasks" : "Show subtasks"}
                      >
                        {task.expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </Button>
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id, board)}
                        className="border-border/70 data-[state=checked]:bg-primary/90 data-[state=checked]:border-primary/90"
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
                          className="flex-1 h-8"
                          autoFocus
                        />
                      ) : (
                        <label
                          htmlFor={`task-${task.id}`}
                          className={`flex-1 flex items-center cursor-pointer text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : "text-foreground"
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
                        onClick={() => deleteTask(task.id, board)}
                        className="text-muted-foreground hover:text-destructive h-6 w-6"
                      >
                        <Trash2 className="w-3 h-3" />
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
                                className="flex items-center gap-2 p-2 ml-4 rounded-md border transition-all bg-background/50 border-border/50"
                              >
                                <Checkbox
                                  id={`subtask-${subtask.id}`}
                                  checked={subtask.completed}
                                  onCheckedChange={() => toggleSubtask(task.id, subtask.id, board)}
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
                                    className="flex-1 h-6 text-xs"
                                    autoFocus
                                  />
                                ) : (
                                  <label
                                    htmlFor={`subtask-${subtask.id}`}
                                    className={`flex-1 cursor-pointer text-xs transition-colors ${subtask.completed ? "line-through text-muted-foreground/70" : "text-foreground/90"
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
                                  onClick={() => deleteSubtask(task.id, subtask.id, board)}
                                  className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                  <span className="sr-only">Delete subtask</span>
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add subtask input - Show when expanded */}
                        <div className="flex gap-2 ml-4">
                          <Input
                            type="text"
                            placeholder="Add a subtask..."
                            value={newSubtask[task.id] || ""}
                            onChange={(e) => setNewSubtask((prev) => ({ ...prev, [task.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                addSubtask(task.id, board)
                              }
                            }}
                            className="flex-1 h-8 text-xs bg-background/70 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/50"
                          />
                          <Button
                            onClick={() => addSubtask(task.id, board)}
                            size="icon"
                            className="h-8 w-8 bg-primary/90 hover:bg-primary text-primary-foreground transition-colors"
                          >
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
          </div>

          {/* Progress indicator */}
          {stats.totalItems > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Progress</span>
                <span>{Math.round((stats.completedTasks / stats.totalTasks) * 100)}%</span>
              </div>
              <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-primary/70 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(stats.completedTasks / stats.totalTasks) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 to-slate-800 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderTaskBoard("today", "Today", "bg-blue-300/50")}
          {renderTaskBoard("longterm", "All", "bg-green-300/50")}
        </div>
      </div>
    </div>
  )
}
