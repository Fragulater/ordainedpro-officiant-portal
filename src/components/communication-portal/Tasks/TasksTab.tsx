"use client"

import { useState } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarDays, FileText, CheckSquare, Plus, Check, Clock, Bell, MapPin, Trash2 } from "lucide-react"
import { Task } from "@/components/AddTaskDialog"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function TasksTab() {
  const [taskPendingArchive, setTaskPendingArchive] = useState<Task | null>(null)
  const {
    setShowAddTaskDialog,
    taskFilter,
    setTaskFilter,
    tasks,
    toggleTaskCompletion,
    handleDeleteTask,
    getFilteredTasks,
    getPriorityColor,
    getPriorityIcon,
  } = useCommunicationPortal()
  const filteredTasks = getFilteredTasks()

  const formatDate = (dateValue: string) => {
    if (!dateValue) return "No date set"

    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) return "No date set"

    return date.toLocaleDateString()
  }

  const formatDueLabel = (task: Task) => {
    const dueDate = formatDate(task.dueDate)
    return task.dueTime ? `Due: ${dueDate} at ${task.dueTime}` : `Due: ${dueDate}`
  }

  const confirmArchiveTask = () => {
    if (!taskPendingArchive) return
    handleDeleteTask(taskPendingArchive.id)
    setTaskPendingArchive(null)
  }

  return (
<TabsContent value="tasks">
            <Card className="border-blue-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-blue-900">Officiant Task List</CardTitle>
                    <CardDescription>View, add, and update your tasks across all ceremonies</CardDescription>
                    <p className="mt-2 text-xs font-medium text-blue-700">
                      This section reflects tasks across all couples and ceremonies so you can quickly reference your upcoming to-do list.
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Select value={taskFilter} onValueChange={(value: string) => setTaskFilter(value)}>
                      <SelectTrigger className="w-48 border-blue-200">
                        <SelectValue placeholder="Filter tasks" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tasks</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="high-priority">High Priority</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      className="bg-blue-500 hover:bg-blue-600"
                      onClick={() => setShowAddTaskDialog(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {filteredTasks.map((task) => (
                    <div key={task.id} className={`p-4 border rounded-xl transition-all ${
                      task.completed ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-blue-100 hover:border-blue-200'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors mt-1 ${
                            task.completed
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300 hover:border-blue-400'
                          }`}
                          onClick={() => toggleTaskCompletion(task.id)}
                        >
                          {task.completed && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className={`font-medium ${task.completed ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                                {task.task}
                              </p>
                              <p className="text-xs font-medium text-blue-700">
                                {task.coupleName || "Ceremony profile"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(task.priority)}>
                                {getPriorityIcon(task.priority)} {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                              </Badge>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                title="Archive task"
                                onClick={() => setTaskPendingArchive(task)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDueLabel(task)}
                            </div>
                            <div className="flex items-center">
                              <FileText className="w-3 h-3 mr-1" />
                              {task.category}
                            </div>
                            {task.ceremonyDate && (
                              <div className="flex items-center">
                                <CalendarDays className="w-3 h-3 mr-1" />
                                Ceremony: {formatDate(task.ceremonyDate)}
                              </div>
                            )}
                            {task.venueName && (
                              <div className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {task.venueName}
                              </div>
                            )}
                          </div>

                          {task.details && (
                            <p className="text-sm text-gray-600 mb-2">{task.details}</p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {task.emailReminder && (
                                <Badge variant="outline" className="border-blue-200 text-blue-700 text-xs">
                                  <Bell className="w-3 h-3 mr-1" />
                                  Reminder {task.reminderDays}d before
                                </Badge>
                              )}
                            </div>
                            <Badge variant={task.completed ? "secondary" : "outline"} className={
                              task.completed ? "bg-green-100 text-green-800" : "border-blue-200 text-blue-700"
                            }>
                              {task.completed ? "Complete" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No tasks found across your ceremonies for the selected filter.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Dialog open={Boolean(taskPendingArchive)} onOpenChange={(open) => !open && setTaskPendingArchive(null)}>
              <DialogContent className="max-w-md overflow-hidden border-blue-100 p-0 shadow-xl">
                <DialogHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 text-left">
                  <DialogTitle className="flex items-center gap-2 text-blue-950">
                    <Trash2 className="h-5 w-5 text-red-600" />
                    Archive Task
                  </DialogTitle>
                  <DialogDescription className="text-blue-800">
                    Remove this task from your officiant task list.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 px-6 py-5">
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-gray-900">{taskPendingArchive?.task}</p>
                    {taskPendingArchive?.coupleName && (
                      <p className="mt-1 text-xs font-medium text-blue-700">{taskPendingArchive.coupleName}</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    This will archive the task and remove it from this list. This action cannot be undone from the portal.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => setTaskPendingArchive(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={confirmArchiveTask}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Archive Task
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
  )
}
