"use client"; // THIS IS REQUIRED AT THE TOP

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { createTask } from "@/services/supabase-api"
import { supabase } from "@/supabase/utils/client";

import {
  Plus,
  Save,
  Calendar,
  Clock,
  AlertCircle,
  Flag,
  Mail,
  Bell,
  CheckSquare,
  X
} from "lucide-react"
export interface Task {
  id: number
  task: string
  completed: boolean
  dueDate: string
  dueTime: string
  details: string
  priority: "low" | "medium" | "high" | "urgent"
  category: string
  emailReminder: boolean
  reminderDays: number
  createdDate: string
}

export interface AddTaskDialogProps {
  onAddTask: (task: Omit<Task, "id" | "createdDate">) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTaskDialog({ onAddTask, isOpen, onOpenChange }: AddTaskDialogProps) {
  const [formData, setFormData] = useState({
    task: "",
    dueDate: "",
    dueTime: "",
    details: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    category: "",
    emailReminder: true,
    reminderDays: 1,
    completed: false,
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) console.error("Failed to fetch user:", error);
      setUser(user);
    };
    fetchUser();
  }, []);

  const priorityOptions = [
    { value: "low", label: "Low Priority", color: "bg-gray-100 text-gray-800 border-gray-200", icon: "🟢" },
    { value: "medium", label: "Medium Priority", color: "bg-blue-100 text-blue-800 border-blue-200", icon: "🟡" },
    { value: "high", label: "High Priority", color: "bg-orange-100 text-orange-800 border-orange-200", icon: "🟠" },
    { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800 border-red-200", icon: "🔴" },
  ]

  const categoryOptions = [
    "Ceremony Planning",
    "Document Preparation",
    "Client Communication",
    "Venue Coordination",
    "Rehearsal Planning",
    "Legal Requirements",
    "Music & Readings",
    "Payment & Contracts",
    "Personal Preparation",
    "Follow-up",
  ]

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    if (!formData.task.trim()) newErrors.task = "Task name is required"
    if (!formData.dueDate) newErrors.dueDate = "Due date is required"
    if (!formData.dueTime) newErrors.dueTime = "Due time is required"
    if (!formData.category) newErrors.category = "Category is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);

    try {
      if (!user) {
        alert("⚠️ Please sign in to save tasks.");
        setSaving(false);
        return;
      }

      console.log("👤 Saving task for user:", user);
      const userId = user.id; // ✅ UUID

      // Couple ID fallback
      let coupleId = 1;
      const savedRaw = localStorage.getItem("ceremonyDetails");
      if (savedRaw) {
        try {
          const savedData = JSON.parse(savedRaw);
          coupleId = savedData.coupleId || 1;
        } catch { }
      }

      const newTaskData = {
        couple_id: coupleId,
        user_id: userId,
        title: formData.task,
        description: formData.details || null,
        due_date: `${formData.dueDate}T${formData.dueTime}`,
        completed: false,
      };

      const { data, error } = await supabase.from("tasks").insert(newTaskData).select().single();
      if (error) throw error;

      console.log("✅ Task created:", data);
      alert("✅ Task saved successfully!");
      onAddTask({ ...formData, completed: false });

      // Reset form
      setFormData({
        task: "",
        dueDate: "",
        dueTime: "",
        details: "",
        priority: "medium",
        category: "",
        emailReminder: true,
        reminderDays: 1,
        completed: false,
      });
      setErrors({});
      onOpenChange(false);

    } catch (err) {
      console.error("❌ Error saving task:", err);
      alert("⚠️ Failed to save task. Please try again.");
    } finally {
      setSaving(false);
    }
  };


  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }))
  }

  const getCurrentPriorityOption = () => {
    return priorityOptions.find(option => option.value === formData.priority)
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-900 flex items-center">
            <CheckSquare className="w-5 h-5 mr-2" />
            Add New Task
          </DialogTitle>
          <DialogDescription>
            Create a new task with priority level, due date, and notification settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Task Name */}
          <div>
            <Label htmlFor="taskName" className="text-sm font-medium text-gray-700">
              Task Name *
            </Label>
            <Input
              id="taskName"
              value={formData.task}
              onChange={(e) => handleInputChange('task', e.target.value)}
              placeholder="Enter task description..."
              className={`mt-1 ${errors.task ? 'border-red-300' : 'border-blue-200 focus:border-blue-500'}`}
            />
            {errors.task && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.task}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category" className="text-sm font-medium text-gray-700">
              Category *
            </Label>
            <Select value={formData.category} onValueChange={(value: string) => handleInputChange('category', value)}>
              <SelectTrigger className={`mt-1 ${errors.category ? 'border-red-300' : 'border-blue-200'}`}>
                <SelectValue placeholder="Select task category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.category}
              </p>
            )}
          </div>

          {/* Due Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700">
                Due Date *
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                className={`mt-1 ${errors.dueDate ? 'border-red-300' : 'border-blue-200 focus:border-blue-500'}`}
              />
              {errors.dueDate && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.dueDate}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="dueTime" className="text-sm font-medium text-gray-700">
                Due Time *
              </Label>
              <Input
                id="dueTime"
                type="time"
                value={formData.dueTime}
                onChange={(e) => handleInputChange('dueTime', e.target.value)}
                className={`mt-1 ${errors.dueTime ? 'border-red-300' : 'border-blue-200 focus:border-blue-500'}`}
              />
              {errors.dueTime && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.dueTime}
                </p>
              )}
            </div>
          </div>

          {/* Priority Level */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Priority Level *
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {priorityOptions.map((option) => (
                <div
                  key={option.value}
                  className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all hover:bg-gray-50 ${formData.priority === option.value
                    ? option.color + ' shadow-md'
                    : 'border-gray-200 bg-white'
                    }`}
                  onClick={() => handleInputChange('priority', option.value)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{option.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{option.label.split(' ')[0]}</p>
                      <p className="text-xs text-gray-500">{option.label.split(' ').slice(1).join(' ')}</p>
                    </div>
                  </div>
                  {formData.priority === option.value && (
                    <div className="absolute top-1 right-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckSquare className="w-2 h-2 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Task Details */}
          <div>
            <Label htmlFor="details" className="text-sm font-medium text-gray-700">
              Task Details
            </Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => handleInputChange('details', e.target.value)}
              placeholder="Add any additional details, notes, or requirements for this task..."
              rows={4}
              className="mt-1 border-blue-200 focus:border-blue-500"
            />
          </div>

          {/* Email Reminder Settings */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Email Notification Settings
            </h4>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emailReminder"
                  checked={formData.emailReminder}
                  onCheckedChange={(checked: boolean) => handleInputChange('emailReminder', checked)}
                />
                <Label htmlFor="emailReminder" className="text-sm">
                  Send email reminder before due date
                </Label>
              </div>

              {formData.emailReminder && (
                <div className="ml-6">
                  <Label htmlFor="reminderDays" className="text-sm font-medium text-gray-700">
                    Send reminder
                  </Label>
                  <Select
                    value={formData.reminderDays.toString()}
                    onValueChange={(value: string) => handleInputChange('reminderDays', parseInt(value))}
                  >
                    <SelectTrigger className="mt-1 w-48 border-blue-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day before</SelectItem>
                      <SelectItem value="2">2 days before</SelectItem>
                      <SelectItem value="3">3 days before</SelectItem>
                      <SelectItem value="7">1 week before</SelectItem>
                      <SelectItem value="14">2 weeks before</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-800 flex items-center">
                    <Bell className="w-3 h-3 mr-1" />
                    Email will be sent to: pastor.michael@ordainedpro.com
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Section */}
          {formData.task && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Task Preview</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{formData.task}</p>
                  {getCurrentPriorityOption() && (
                    <Badge className={getCurrentPriorityOption()!.color}>
                      {getCurrentPriorityOption()!.icon} {getCurrentPriorityOption()!.label}
                    </Badge>
                  )}
                </div>
                {formData.category && (
                  <p className="text-sm text-gray-600">📁 {formData.category}</p>
                )}
                {formData.dueDate && formData.dueTime && (
                  <p className="text-sm text-gray-600 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    Due: {new Date(formData.dueDate).toLocaleDateString()} at {formData.dueTime}
                  </p>
                )}
                {formData.details && (
                  <p className="text-sm text-gray-600">{formData.details}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-500 hover:bg-blue-600"
            disabled={!formData.task || !formData.dueDate || !formData.dueTime}
          >
            <Save className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
