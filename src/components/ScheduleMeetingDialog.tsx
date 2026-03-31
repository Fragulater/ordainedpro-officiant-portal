"use client"


import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/supabase/utils/client";
import {
  Calendar,
  Clock,
  Mail,
  Send,
  MapPin,
  Users,
  Video,
  Phone,
  AlertCircle,
  Check,
  X,
  Save,
  CalendarPlus,
  Bell
} from "lucide-react"

export interface Meeting {
  id: number
  subject: string
  body: string
  date: string
  time: string
  duration: number
  location: string
  meetingType: 'in-person' | 'video' | 'phone'
  attendees: string[]
  status: 'pending' | 'accepted' | 'declined' | 'confirmed'
  createdDate: string
  reminderSent: boolean
  calendarInviteSent: boolean
  responseDeadline: string
}

export interface ScheduleMeetingDialogProps {
  onScheduleMeeting: (meeting: Omit<Meeting, 'id' | 'createdDate' | 'status' | 'reminderSent' | 'calendarInviteSent'>) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  coupleEmails?: string[]
  coupleName?: string
}

export function ScheduleMeetingDialog({
  onScheduleMeeting,
  isOpen,
  onOpenChange,
  coupleEmails = ["ganuactivate@gmail.com", "ganuactivate@gmail.com"],
  coupleName = "Sarah & David"
}: ScheduleMeetingDialogProps) {
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
    date: "",
    time: "",
    duration: 60,
    location: "",
    meetingType: "video" as 'in-person' | 'video' | 'phone',
    attendees: coupleEmails,
    responseDeadline: "",
    sendCalendarInvite: true,
    sendEmailNotification: true,
    includeZoomLink: true
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false)
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) console.error("Failed to fetch user:", error);
      else setUser(user);
      console.log("Fetched user:", user);
    };
    fetchUser();
  }, []);
  const meetingTemplates = [
    {
      name: "Initial Consultation",
      subject: "Wedding Ceremony Consultation - {couple}",
      body: "Dear {couple},\n\nI'm excited to meet with you to discuss your upcoming wedding ceremony! During our consultation, we'll cover:\n\n• Your vision for the ceremony\n• Personal vows and readings\n• Unity ceremonies and traditions\n• Timeline and logistics\n• Any special requests or requirements\n\nPlease come prepared with any questions you may have. I look forward to helping make your special day perfect!\n\nWarm regards,\nPastor Michael"
    },
    {
      name: "Ceremony Planning",
      subject: "Wedding Ceremony Planning Meeting - {couple}",
      body: "Hello {couple},\n\nLet's meet to finalize the details of your wedding ceremony. We'll review:\n\n• Final ceremony script\n• Music selections\n• Processional order\n• Rehearsal arrangements\n• Day-of logistics\n\nPlease bring any final changes or special requests you'd like to discuss.\n\nBlessings,\nPastor Michael"
    },
    {
      name: "Pre-Wedding Check-in",
      subject: "Pre-Wedding Check-in - {couple}",
      body: "Dear {couple},\n\nAs your wedding day approaches, I'd love to connect and ensure everything is ready. We'll discuss:\n\n• Final ceremony details\n• Last-minute questions\n• Wedding day timeline\n• Emotional preparation\n• Any concerns or excitement you'd like to share\n\nLooking forward to celebrating with you soon!\n\nWith joy,\nPastor Michael"
    }
  ]

  const durationOptions = [
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" }
  ]

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required"
    }

    if (!formData.body.trim()) {
      newErrors.body = "Message body is required"
    }

    if (!formData.date) {
      newErrors.date = "Meeting date is required"
    }

    if (!formData.time) {
      newErrors.time = "Meeting time is required"
    }

    if (!formData.responseDeadline) {
      newErrors.responseDeadline = "Response deadline is required"
    }

    // Check if response deadline is before meeting date
    if (formData.date && formData.responseDeadline) {
      const meetingDate = new Date(formData.date)
      const deadlineDate = new Date(formData.responseDeadline)
      if (deadlineDate >= meetingDate) {
        newErrors.responseDeadline = "Response deadline must be before meeting date"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleTemplateSelect = (template: typeof meetingTemplates[0]) => {
    const processedSubject = template.subject.replace('{couple}', coupleName)
    const processedBody = template.body.replace(/{couple}/g, coupleName)

    setFormData(prev => ({
      ...prev,
      subject: processedSubject,
      body: processedBody
    }))
  }

  const generateCalendarInvite = (meetingData: any) => {
    const startDateTime = new Date(`${meetingData.date}T${meetingData.time}`)
    const endDateTime = new Date(startDateTime.getTime() + (meetingData.duration * 60000))

    const calendarEvent = {
      title: meetingData.subject,
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      description: meetingData.body,
      location: meetingData.location,
      attendees: meetingData.attendees,
      organizer: "pastor.michael@ordainedpro.com"
    }

    return calendarEvent
  }

  const generateEmailContent = (meetingData: any, calendarEvent: any) => {
    const meetingTypeInfo: Record<string, string> = {
      'video': '💻 Video Call (Zoom link will be provided)',
      'phone': '📞 Phone Call',
      'in-person': `📍 In-Person at ${meetingData.location || 'Location TBD'}`
    }

    return {
      to: meetingData.attendees,
      cc: ["pastor.michael@ordainedpro.com"],
      subject: `📅 Meeting Request: ${meetingData.subject}`,
      body: `
Dear ${coupleName},

You have been invited to a meeting!

📋 MEETING DETAILS:
━━━━━━━━━━━━━━━━━━━━
📅 Date: ${new Date(meetingData.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
🕐 Time: ${meetingData.time}
⏱️ Duration: ${meetingData.duration} minutes
${meetingTypeInfo[meetingData.meetingType]}

📝 MESSAGE:
━━━━━━━━━━━━━━━━━━━━
${meetingData.body}

🔔 IMPORTANT:
━━━━━━━━━━━━━━━━━━━━
⚠️ Please respond by: ${new Date(meetingData.responseDeadline).toLocaleDateString()}
📧 Reply to this email with: ACCEPT, DECLINE, or RESCHEDULE
📱 A calendar invitation is attached to this email

${meetingData.meetingType === 'video' && meetingData.includeZoomLink ? `
🎥 VIDEO CALL DETAILS:
━━━━━━━━━━━━━━━━━━━━
Zoom Meeting ID: 123-456-7890
Password: WeddingMeeting2024
Join URL: https://zoom.us/j/1234567890

📱 Dial-in Number: +1-555-123-4567
` : ''}

Looking forward to meeting with you!

Warm regards,
Pastor Michael Adams
Licensed Wedding Officiant
📧 pastor.michael@ordainedpro.com
📱 (555) 987-6543

───────────────────────────────
🏷️ This is an automated message from OrdainedPro Communication Portal
      `,
      attachments: [
        {
          filename: `meeting-invite-${meetingData.date}.ics`,
          content: generateICalContent(calendarEvent)
        }
      ]
    }
  }

  const generateICalContent = (event: any) => {
    // Simplified iCal format for calendar invitations
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//OrdainedPro//Wedding Planning//EN
BEGIN:VEVENT
DTSTART:${event.start.replace(/[-:]/g, '').replace(/\.\d{3}/, '')}
DTEND:${event.end.replace(/[-:]/g, '').replace(/\.\d{3}/, '')}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${event.location}
ORGANIZER:mailto:${event.organizer}
ATTENDEE:mailto:${event.attendees[0]}
ATTENDEE:mailto:${event.attendees[1]}
STATUS:TENTATIVE
SEQUENCE:0
END:VEVENT
END:VCALENDAR`
  }


  // const handleSendInvite = async () => {
  //   if (!validateForm()) return;
  //   if (!user?.id) {
  //     alert("⚠️ Please sign in to schedule a meeting.");
  //     return;
  //   }

  //   setIsGeneratingInvite(true);

  //   try {
  //     await new Promise(resolve => setTimeout(resolve, 2000));
  //     const coupleId = 1
  //     const meetingData = {
  //       couple_id: coupleId, // passed as prop
  //       user_id: user.id,
  //       title: formData.subject,
  //       date: formData.date,
  //       time: formData.time || null,
  //       location: formData.location || null,
  //       notes: formData.body || null,
  //       created_at: new Date().toISOString(),
  //       updated_at: new Date().toISOString(),
  //     };

  //     const { data: meetingInsert, error: meetingError } = await supabase
  //       .from("meetings")
  //       .insert(meetingData)
  //       .select()
  //       .single();

  //     if (meetingError) throw meetingError;

  //     console.log("✅ Meeting saved in Supabase:", meetingInsert);

  //     // Generate calendar & email
  //     const calendarEvent = generateCalendarInvite(formData);
  //     const emailContent = generateEmailContent(formData, calendarEvent);

  //     console.log("📧 Calendar invite email generated:", emailContent);

  //     const newMeeting: Meeting = {
  //       id: meetingInsert?.id || Date.now(),             
  //       couple_id: meetingInsert?.couple_id || coupleId,
  //       user_id: meetingInsert?.user_id || user.id,
  //       title: meetingInsert?.title || formData.subject,
  //       date: meetingInsert?.date || formData.date,
  //       time: meetingInsert?.time || formData.time || null,
  //       location: meetingInsert?.location || formData.location || null,
  //       notes: meetingInsert?.notes || formData.body || null,
  //       createdDate: meetingInsert?.created_at || new Date().toISOString(),
  //       updated_at: meetingInsert?.updated_at || new Date().toISOString(),
  //       subject: formData.subject,
  //       body: formData.body,
  //       duration: formData.duration,
  //       meetingType: formData.meetingType,
  //       attendees: formData.attendees,
  //       responseDeadline: formData.responseDeadline,
  //       status: "pending",               // default status
  //       reminderSent: false,             // default
  //       calendarInviteSent: false        // default
  //     };

  //     onScheduleMeeting(newMeeting);

  //     // Reset form
  //     setFormData({
  //       subject: "",
  //       body: "",
  //       date: "",
  //       time: "",
  //       duration: 60,
  //       location: "",
  //       meetingType: "video",
  //       attendees: coupleEmails,
  //       responseDeadline: "",
  //       sendCalendarInvite: true,
  //       sendEmailNotification: true,
  //       includeZoomLink: true,
  //     });
  //     setErrors({});
  //     onOpenChange(false);

  //     alert("📅 Meeting invitation sent successfully!");
  //   } catch (err) {
  //     console.error("❌ Error saving meeting:", err);
  //     alert("⚠️ Failed to schedule meeting. Please try again.");
  //   } finally {
  //     setIsGeneratingInvite(false);
  //   }
  // };

  const handleSendInvite = async () => {
    if (!validateForm()) return;

    if (!user?.id) {
      alert("⚠️ Please sign in to schedule a meeting.");
      return;
    }

    setIsGeneratingInvite(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const coupleId = 1;

      // 1️⃣ Save meeting to Supabase
      const meetingData = {
        couple_id: coupleId,
        user_id: user.id,
        title: formData.subject,
        date: formData.date,
        time: formData.time || null,
        location: formData.location || null,
        notes: formData.body || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: meetingInsert, error: meetingError } = await supabase
        .from("meetings")
        .insert(meetingData)
        .select()
        .single();

      if (meetingError) throw meetingError;

      console.log("✅ Meeting saved in Supabase:", meetingInsert);

      // 2️⃣ Send meeting invite email through backend
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const emailPayload = {
        subject: formData.subject,
        body: formData.body,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        meetingType: formData.meetingType,
        location: formData.location,
        responseDeadline: formData.responseDeadline,
      };

      const emailRes = await fetch("http://localhost:5000/api/email/send-meeting-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      const emailResult = await emailRes.json();
      if (!emailRes.ok) throw new Error(emailResult.error || "Email sending failed");

      console.log("📧 Email invite sent successfully:", emailResult);

      // 3️⃣ Create local meeting object for UI
      const newMeeting: Meeting = {
        id: meetingInsert?.id || Date.now(),
        couple_id: meetingInsert?.couple_id || coupleId,
        user_id: meetingInsert?.user_id || user.id,
        title: meetingInsert?.title || formData.subject,
        date: meetingInsert?.date || formData.date,
        time: meetingInsert?.time || formData.time || null,
        location: meetingInsert?.location || formData.location || null,
        notes: meetingInsert?.notes || formData.body || null,
        createdDate: meetingInsert?.created_at || new Date().toISOString(),
        updated_at: meetingInsert?.updated_at || new Date().toISOString(),
        subject: formData.subject,
        body: formData.body,
        duration: formData.duration,
        meetingType: formData.meetingType,
        attendees: formData.attendees,
        responseDeadline: formData.responseDeadline,
        status: "pending",
        reminderSent: false,
        calendarInviteSent: true, // ✅ now true since email sent
      };

      onScheduleMeeting(newMeeting);

      // 4️⃣ Reset form
      setFormData({
        subject: "",
        body: "",
        date: "",
        time: "",
        duration: 60,
        location: "",
        meetingType: "video",
        attendees: coupleEmails,
        responseDeadline: "",
        sendCalendarInvite: true,
        sendEmailNotification: true,
        includeZoomLink: true,
      });

      setErrors({});
      onOpenChange(false);

      alert("📅 Meeting scheduled and email invitation sent successfully!");
    } catch (err) {
      console.error("❌ Error saving/sending meeting:", err);
      alert("⚠️ Failed to schedule meeting or send invitation. Please try again.");
    } finally {
      setIsGeneratingInvite(false);
    }
  };


  const handleInputChange = (field: string, value: string | boolean | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }))
    }
  }

  // Auto-set response deadline to 3 days before meeting when date is selected
  const handleDateChange = (date: string) => {
    handleInputChange('date', date)

    if (date) {
      const meetingDate = new Date(date)
      const deadlineDate = new Date(meetingDate)
      deadlineDate.setDate(meetingDate.getDate() - 3)

      // Don't set if it would be in the past
      const today = new Date()
      if (deadlineDate > today) {
        handleInputChange('responseDeadline', deadlineDate.toISOString().split('T')[0])
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-900 flex items-center">
            <CalendarPlus className="w-5 h-5 mr-2" />
            Schedule Meeting with {coupleName}
          </DialogTitle>
          <DialogDescription>
            Send a calendar invitation and email notification to schedule a meeting with your couple
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
          {/* Main Form - Left Side */}
          <div className="lg:col-span-2 space-y-6">

            {/* Quick Templates */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">📋 Quick Templates</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {meetingTemplates.map((template, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTemplateSelect(template)}
                    className="text-left justify-start border-blue-200 hover:bg-blue-100"
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Subject Line */}
            <div>
              <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                Subject Line *
              </Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Enter meeting subject..."
                className={`mt-1 ${errors.subject ? 'border-red-300' : 'border-blue-200 focus:border-blue-500'}`}
              />
              {errors.subject && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.subject}
                </p>
              )}
            </div>

            {/* Message Body */}
            <div>
              <Label htmlFor="body" className="text-sm font-medium text-gray-700">
                Message Body *
              </Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => handleInputChange('body', e.target.value)}
                placeholder="Enter your message to the couple..."
                rows={8}
                className={`mt-1 ${errors.body ? 'border-red-300' : 'border-blue-200 focus:border-blue-500'}`}
              />
              {errors.body && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.body}
                </p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                  Meeting Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`mt-1 ${errors.date ? 'border-red-300' : 'border-blue-200 focus:border-blue-500'}`}
                />
                {errors.date && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.date}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="time" className="text-sm font-medium text-gray-700">
                  Meeting Time *
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className={`mt-1 ${errors.time ? 'border-red-300' : 'border-blue-200 focus:border-blue-500'}`}
                />
                {errors.time && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.time}
                  </p>
                )}
              </div>
            </div>

            {/* Duration and Response Deadline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                  Duration
                </Label>
                <Select value={formData.duration.toString()} onValueChange={(value: string) => handleInputChange('duration', parseInt(value))}>
                  <SelectTrigger className="mt-1 border-blue-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="responseDeadline" className="text-sm font-medium text-gray-700">
                  Response Deadline *
                </Label>
                <Input
                  id="responseDeadline"
                  type="date"
                  value={formData.responseDeadline}
                  onChange={(e) => handleInputChange('responseDeadline', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`mt-1 ${errors.responseDeadline ? 'border-red-300' : 'border-blue-200 focus:border-blue-500'}`}
                />
                {errors.responseDeadline && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.responseDeadline}
                  </p>
                )}
              </div>
            </div>

            {/* Meeting Type */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Meeting Type *
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'video', label: 'Video Call', icon: Video, description: 'Zoom/Google Meet' },
                  { value: 'phone', label: 'Phone Call', icon: Phone, description: 'Voice only' },
                  { value: 'in-person', label: 'In Person', icon: Users, description: 'Face to face' }
                ].map((type) => (
                  <div
                    key={type.value}
                    className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all hover:bg-gray-50 ${formData.meetingType === type.value
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white'
                      }`}
                    onClick={() => handleInputChange('meetingType', type.value)}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <type.icon className={`w-6 h-6 ${formData.meetingType === type.value ? 'text-blue-600' : 'text-gray-500'}`} />
                      <div>
                        <p className="text-sm font-medium">{type.label}</p>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                    </div>
                    {formData.meetingType === type.value && (
                      <div className="absolute top-1 right-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-2 h-2 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Location (for in-person meetings) */}
            {formData.meetingType === 'in-person' && (
              <div>
                <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                  Meeting Location *
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter meeting address..."
                  className="mt-1 border-blue-200 focus:border-blue-500"
                />
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">

            {/* Meeting Preview */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">📅 Meeting Preview</h4>
              <div className="space-y-2 text-sm">
                {formData.subject && (
                  <div>
                    <p className="font-medium text-gray-900">{formData.subject}</p>
                  </div>
                )}
                {formData.date && formData.time && (
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(formData.date).toLocaleDateString()} at {formData.time}
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <Clock className="w-3 h-3 mr-1" />
                  {formData.duration} minutes
                </div>
                {formData.meetingType === 'video' && (
                  <div className="flex items-center text-blue-600">
                    <Video className="w-3 h-3 mr-1" />
                    Video Call (Zoom)
                  </div>
                )}
                {formData.meetingType === 'phone' && (
                  <div className="flex items-center text-green-600">
                    <Phone className="w-3 h-3 mr-1" />
                    Phone Call
                  </div>
                )}
                {formData.meetingType === 'in-person' && formData.location && (
                  <div className="flex items-center text-purple-600">
                    <MapPin className="w-3 h-3 mr-1" />
                    {formData.location}
                  </div>
                )}
              </div>
            </div>

            {/* Attendees */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">👥 Attendees</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white text-xs">PM</span>
                  </div>
                  <div>
                    <p className="font-medium">Pastor Michael (Organizer)</p>
                    <p className="text-xs text-gray-600">ganuactivate@gmail.com</p>
                  </div>
                </div>
                {formData.attendees.map((email, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-xs">{index === 0 ? 'SJ' : 'DC'}</span>
                    </div>
                    <div>
                      <p className="font-medium">{index === 0 ? 'Sarah Johnson' : 'David Chen'}</p>
                      <p className="text-xs text-gray-600">{email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Email Settings */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Email & Calendar Settings
              </h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendCalendarInvite"
                    checked={formData.sendCalendarInvite}
                    onCheckedChange={(checked: boolean) => handleInputChange('sendCalendarInvite', checked)}
                  />
                  <Label htmlFor="sendCalendarInvite" className="text-sm">
                    Send calendar invite (.ics file)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendEmailNotification"
                    checked={formData.sendEmailNotification}
                    onCheckedChange={(checked: boolean) => handleInputChange('sendEmailNotification', checked)}
                  />
                  <Label htmlFor="sendEmailNotification" className="text-sm">
                    Send email notification
                  </Label>
                </div>
                {formData.meetingType === 'video' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeZoomLink"
                      checked={formData.includeZoomLink}
                      onCheckedChange={(checked: boolean) => handleInputChange('includeZoomLink', checked)}
                    />
                    <Label htmlFor="includeZoomLink" className="text-sm">
                      Include Zoom meeting details
                    </Label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={isGeneratingInvite}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSendInvite}
            className="bg-blue-500 hover:bg-blue-600"
            disabled={!formData.subject || !formData.body || !formData.date || !formData.time || isGeneratingInvite}
          >
            {isGeneratingInvite ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Sending Invitation...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Meeting Invitation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
