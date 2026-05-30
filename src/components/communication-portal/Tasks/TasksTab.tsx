"use client"

import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, CheckSquare, Plus, Check, Clock, Bell } from "lucide-react"
import { Task } from "@/components/AddTaskDialog"
import { useCommunicationPortal } from "../CommunicationPortalContext"

export function TasksTab() {
  const {
    setShowAddTaskDialog,
    taskFilter,
    setTaskFilter,
    tasks,
    toggleTaskCompletion,
    getFilteredTasks,
    getPriorityColor,
    getPriorityIcon,
  } = useCommunicationPortal()

  return (
<TabsContent value="tasks">
            <Card className="border-blue-100 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-blue-900">Ceremony Checklist</CardTitle>
                    <CardDescription>Track progress and stay organized for the ceremony</CardDescription>
                    <p className="mt-2 text-xs font-medium text-blue-700">
                      Ceremony checklist tasks are visible to all parties in this profile.
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
                  {getFilteredTasks().map((task) => (
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
                            <p className={`font-medium ${task.completed ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                              {task.task}
                            </p>
                            <Badge className={getPriorityColor(task.priority)}>
                              {getPriorityIcon(task.priority)} {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              Due: {new Date(task.dueDate).toLocaleDateString()} at {task.dueTime}
                            </div>
                            <div className="flex items-center">
                              <FileText className="w-3 h-3 mr-1" />
                              {task.category}
                            </div>
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
                  {getFilteredTasks().length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No tasks found for the selected filter.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
  )
}
