"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { supabase } from "@/supabase/utils/client";
import {
  LayoutDashboard,
  Heart,
  Calendar as CalendarIcon,
  User,
  FileText,
  Settings,
  Search,
  MapPin,
  Phone,
  Mail,
  Clock,
  TrendingUp,
  Upload,
  Download,
  Copy,
  Eye,
  Pencil,
  Trash2,
  Plus,
  ChevronRight,
  Save,
  Star,
  X,
  Globe,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Link as LinkIcon,
  Camera,
  Instagram,
  Crown,
  Sparkles,
  CreditCard,
  Check,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Ceremony {
  id: string;
  couple1Name: string;
  couple1Initial: string;
  couple1Color: string;
  couple2Name: string;
  couple2Initial: string;
  couple2Color: string;
  date: string;
  rawDate: string; // ISO date string for calculations
  time: string;
  location: string;
  email: string;
  phone: string;
  status: "Active" | "Completed" | "Archived";
  guests?: number;
}

interface Couple {
  id: number;
  brideName: string;
  brideEmail: string;
  bridePhone: string;
  brideAddress?: string;
  groomName: string;
  groomEmail: string;
  groomPhone: string;
  groomAddress?: string;
  address: string;
  emergencyContact: string;
  specialRequests: string;
  isActive: boolean;
  weddingDetails: {
    venueName: string;
    venueAddress: string;
    weddingDate: string;
    startTime: string;
    endTime: string;
    expectedGuests: string;
  };
}

interface DashboardMeeting {
  id: number;
  coupleId: number;
  title: string;
  date: string;
  time: string;
  location: string;
  status: string;
}

interface DashboardCalendarEvent {
  id: string;
  type: "wedding" | "meeting";
  date: string;
  time: string;
  title: string;
  subtitle: string;
  location: string;
  coupleId?: string;
  ceremony?: Ceremony;
  status?: string;
}

interface OfficiantDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCouple: (ceremonyId: string) => void;
  couples?: Couple[];
  onAddCeremony?: (newCouple: Partial<Couple>) => void;
  documentsData?: Array<{
    id: string;
    name: string;
    size: string;
    type: string;
    updated: string;
    status?: string;
    source?: "contract" | "user_file";
  }>;
  onDocumentView?: (documentId: string) => void;
  onDocumentEdit?: (documentId: string) => void;
  onDocumentDownload?: (documentId: string) => void;
  onDocumentDelete?: (documentId: string) => void;
  onDocumentAssignToCouple?: (documentId: string, coupleId: number) => void;
  initialView?:
    | "dashboard"
    | "ceremonies"
    | "profile"
    | "calendar"
    | "documents"
    | "settings";
}

interface OfficiantProfile {
  // Basic Info
  fullName: string;
  businessName: string;
  headshot: string;
  city: string;
  state: string;
  travelRadiusMiles: number;
  travelState: string;

  // Experience & Rating
  yearsExperience: number;
  rating: number;
  totalReviews: number;

  // Contact Info
  phone: string;
  email: string;
  website: string;
  socialMedia: {
    facebook: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };

  // Pricing
  priceRange: {
    min: number;
    max: number;
  };

  // Bio
  bio: string;

  // Media
  photoGallery: string[];
  videoUrl: string;
}

// Helper function to calculate days until ceremony
const getDaysUntilCeremony = (ceremonyDate: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ceremony = new Date(ceremonyDate);
  ceremony.setHours(0, 0, 0, 0);

  const diffTime = ceremony.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days ago`;
  } else if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Tomorrow";
  } else {
    return `In ${diffDays} days`;
  }
};

export function OfficiantDashboardDialog({
  open,
  onOpenChange,
  onSelectCouple,
  couples,
  onAddCeremony,
  documentsData = [],
  onDocumentView,
  onDocumentEdit,
  onDocumentDownload,
  onDocumentDelete,
  onDocumentAssignToCouple,
  initialView = "dashboard",
}: OfficiantDashboardDialogProps) {
  // Subscription information
  const { subscription, isProfessional, isAspirant } = useSubscription();

  const [activeView, setActiveView] = useState<
    | "dashboard"
    | "ceremonies"
    | "calendar"
    | "documents"
    | "profile"
    | "settings"
  >(initialView);
  const [ceremonyFilter, setCeremonyFilter] = useState<
    "Active" | "Archived" | "All"
  >("Active");
  const [searchQuery, setSearchQuery] = useState("");
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [showAddCeremonyDialog, setShowAddCeremonyDialog] = useState(false);
  const [documentToAssign, setDocumentToAssign] = useState<string | null>(null);
  const [assignCoupleId, setAssignCoupleId] = useState("");
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [publicProfileCopied, setPublicProfileCopied] = useState(false);
  // Form state for Add New Ceremony - mirrors Communication Portal
  const [newCeremony, setNewCeremony] = useState({
    ceremonyName: "",
    ceremonyDate: "",
    ceremonyTime: "",
    venueName: "",
    venueAddress: "",
    expectedGuests: "",
    brideName: "",
    brideEmail: "",
    bridePhone: "",
    brideAddress: "",
    groomName: "",
    groomEmail: "",
    groomPhone: "",
    groomAddress: "",
    totalAmount: "",
    depositAmount: "",
    finalPaymentDate: "",
    notes: "",
  });

  // Profile state
  const [profile, setProfile] = useState<OfficiantProfile>({
    fullName: "",
    businessName: "",
    headshot: "",
    city: "",
    state: "",
    travelRadiusMiles: 50,
    travelState: "",
    yearsExperience: 0,
    rating: 4.8,
    totalReviews: 0,
    phone: "",
    email: "",
    website: "",
    socialMedia: {
      facebook: "",
      instagram: "",
      linkedin: "",
      youtube: "",
    },
    priceRange: {
      min: 300,
      max: 800,
    },
    bio: "",
    photoGallery: [],
    videoUrl: "",
  });

  const getCleanDisplayName = (...candidates: Array<string | null | undefined>) => {
    const name = candidates
      .map((candidate) => candidate?.trim())
      .find((candidate) => candidate && !candidate.includes("@"));

    return name || "Officiant";
  };

  const getInitials = (name: string) => {
    if (name === "Officiant") return "OF";

    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const officiantFullName = getCleanDisplayName(
    profile.fullName,
    user?.user_metadata?.full_name,
    user?.user_metadata?.name
  );
  const officiantFirstName =
    officiantFullName === "Officiant"
      ? "Officiant"
      : officiantFullName.split(/\s+/)[0];
  const officiantLabel =
    officiantFullName === "Officiant"
      ? "Officiant"
      : `Officiant ${officiantFirstName}`;
  const publicProfilePath = user?.id ? `/officiants/${user.id}` : "/find-officiant";
  const publicProfileUrl =
    typeof window !== "undefined" && user?.id
      ? `${window.location.origin}${publicProfilePath}`
      : publicProfilePath;
  const handleCopyPublicProfileUrl = async () => {
    if (!user?.id) return;

    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      setPublicProfileCopied(true);
      window.setTimeout(() => setPublicProfileCopied(false), 1800);
    } catch (error) {
      console.error("Unable to copy public profile URL:", error);
    }
  };
  const handleSharePublicProfileByEmail = () => {
    if (!user?.id) return;

    const subject = encodeURIComponent(`${officiantFullName}'s OrdainedPro profile`);
    const body = encodeURIComponent(
      `Here is my OrdainedPro public profile:\n\n${publicProfileUrl}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };
  const getCoupleColors = (coupleId: number) => {
    const colorPairs = [
      {
        bride: "bg-pink-500",
        groom: "bg-blue-500",
        brideRing: "ring-pink-100",
        groomRing: "ring-blue-100",
        brideText: "text-pink-600",
        groomText: "text-blue-600",
        brideIcon: "text-pink-500",
        groomIcon: "text-blue-500",
      },
      {
        bride: "bg-red-500",
        groom: "bg-indigo-500",
        brideRing: "ring-red-100",
        groomRing: "ring-indigo-100",
        brideText: "text-red-600",
        groomText: "text-indigo-600",
        brideIcon: "text-red-500",
        groomIcon: "text-indigo-500",
      },
      {
        bride: "bg-purple-500",
        groom: "bg-green-500",
        brideRing: "ring-purple-100",
        groomRing: "ring-green-100",
        brideText: "text-purple-600",
        groomText: "text-green-600",
        brideIcon: "text-purple-500",
        groomIcon: "text-green-500",
      },
      {
        bride: "bg-orange-500",
        groom: "bg-cyan-500",
        brideRing: "ring-orange-100",
        groomRing: "ring-cyan-100",
        brideText: "text-orange-600",
        groomText: "text-cyan-600",
        brideIcon: "text-orange-500",
        groomIcon: "text-cyan-500",
      },
    ];
    return colorPairs[(coupleId - 1) % colorPairs.length];
  };
  const [allCouples, setAllCouples] = useState<any[]>([]);
  const [savedCeremonies, setSavedCeremonies] = useState<any[]>([]);
  const [dashboardMeetings, setDashboardMeetings] = useState<DashboardMeeting[]>([]);

  const parseDateOnly = (dateString?: string) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };

  const formatDateOnly = (dateString?: string) => {
    const date = parseDateOnly(dateString);
    if (!date) return "Date TBD";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "Time TBD";
    const [hour, minute] = timeString.split(":").map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return timeString;
    return new Date(2000, 0, 1, hour, minute).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Transform couples data to ceremonies format
  useEffect(() => {
    if (couples && couples.length > 0) {
      const transformedCeremonies: Ceremony[] = couples.map((couple) => {
        const getInitials = (name: string) =>
          name
            ? name.split(" ").map((n: string) => n[0]).join("")
            : "";

        const weddingDate = couple.weddingDetails?.weddingDate
          ? (parseDateOnly(couple.weddingDetails.weddingDate) || new Date(couple.weddingDetails.weddingDate)).toLocaleDateString(
              "en-US",
              { year: "numeric", month: "long", day: "numeric" }
            )
          : "TBD";

        const parsedWeddingDate = parseDateOnly(couple.weddingDetails?.weddingDate);
        const isPastDate = parsedWeddingDate ? parsedWeddingDate < new Date() : false;

        // Use colors from couple object or fallback to defaults
        const coupleColors = (couple as any).colors || {
          bride: "bg-pink-500",
          groom: "bg-blue-500",
        };

        return {
          id: couple?.id?.toString() || "0",
          couple1Name: couple?.brideName || "Partner 1",
          couple1Initial: getInitials(couple?.brideName || ""),
          couple1Color: coupleColors.bride,
          couple2Name: couple?.groomName || "Partner 2",
          couple2Initial: getInitials(couple?.groomName || ""),
          couple2Color: coupleColors.groom,
          date: weddingDate,
          rawDate: couple.weddingDetails?.weddingDate || "",
          time: couple.weddingDetails?.startTime
            ? new Date(
                `2000-01-01T${couple.weddingDetails.startTime}`
              ).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })
            : "TBD",
          location: couple.weddingDetails?.venueName || "TBD",
          email: couple.brideEmail || couple.groomEmail || "",
          phone: couple.bridePhone || couple.groomPhone || "",
          status: !couple.isActive ? "Archived" : "Active",
          guests: couple.weddingDetails?.expectedGuests
            ? parseInt(couple.weddingDetails.expectedGuests)
            : 0,
        };
      });
      setCeremonies(transformedCeremonies);
    } else {
      // Default ceremonies if no couples provided
      const defaultCeremonies: Ceremony[] = [
        {
          id: "1",
          couple1Name: "Sarah Johnson",
          couple1Initial: "SJ",
          couple1Color: "bg-pink-500",
          couple2Name: "David Chen",
          couple2Initial: "DC",
          couple2Color: "bg-blue-500",
          date: "August 24, 2024",
          rawDate: "2024-08-24",
          time: "3:00 PM",
          location: "Sunset Gardens",
          email: "sarah.johnson@email.com",
          phone: "(555) 123-4567",
          status: "Active",
          guests: 75,
        },
      ];
      setCeremonies(defaultCeremonies);
    }
  }, [couples]);

  useEffect(() => {
    const loadDashboardMeetings = async () => {
      if (!user?.id || !open) return;

      const { data, error } = await supabase
        .from("meetings")
        .select("id,couple_id,title,date,time,location,status")
        .eq("user_id", user.id)
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (error) {
        console.error("Failed to load dashboard meetings:", error);
        setDashboardMeetings([]);
        return;
      }

      setDashboardMeetings(
        (data || []).map((meeting: any) => ({
          id: meeting.id,
          coupleId: Number(meeting.couple_id),
          title: meeting.title || "Scheduled Meeting",
          date: meeting.date || "",
          time: meeting.time || "",
          location: meeting.location || "",
          status: meeting.status || "pending",
        }))
      );
    };

    loadDashboardMeetings();
  }, [user?.id, open, activeView]);

  // ✅ Load profile from Supabase (not localStorage)
  useEffect(() => {
    const loadProfileFromSupabase = async () => {
      try {
        if (!user?.id) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No profile exists yet - that's ok, use defaults
            console.log("📝 No profile found, using defaults");
            return;
          }
          throw error;
        }

        if (data) {
          console.log("✅ Loaded profile from Supabase:", data);
          setProfile({
            fullName: data.full_name || "",
            businessName: data.business_name || "",
            city: data.city || "",
            state: data.state || "",
            travelRadiusMiles: data.travel_radius_miles || 50,
            travelState: data.travel_state || data.state || "",
            phone: data.phone || "",
            email: data.email || "",
            website: data.website || "",
            bio: data.bio || "",
            headshot: data.headshot_url || "",
            yearsExperience: data.years_experience || 0,
            priceRange: {
              min: data.price_min || 0,
              max: data.price_max || 0,
            },
            socialMedia: {
              facebook: data.social_facebook || "",
              instagram: data.social_instagram || "",
              linkedin: data.social_linkedin || "",
              youtube: data.social_youtube || "",
            },
            photoGallery: data.photo_gallery || [],
            videoUrl: data.video_url || "",
            rating: 4.8, // Default rating
            totalReviews: 0, // Default reviews count
          });
        }
      } catch (err) {
        console.error("❌ Error loading profile from Supabase:", err);
      }
    };

    loadProfileFromSupabase();
  }, [user?.id]);

  // Update active view when dialog opens with initialView
  useEffect(() => {
    if (open && initialView) {
      setActiveView(initialView);
    }
  }, [open, initialView]);

  // ✅ Load documents from Supabase (placeholder for now - can be implemented later)
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) console.error("Failed to fetch user:", error);
      else setUser(user);
      console.log("Fetched user:", user);
    };
    fetchUser();
  }, []);
  const filteredCeremonies = ceremonies.filter((ceremony) => {
    const matchesFilter =
      ceremonyFilter === "All" || ceremony.status === ceremonyFilter;
    const matchesSearch =
      searchQuery === "" ||
      ceremony.couple1Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ceremony.couple2Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ceremony.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ceremony.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Get current year for YTD calculations
  const currentYear = new Date().getFullYear();
  const currentDate = new Date();

  const activeCeremonies = ceremonies.filter((c) => c.status === "Active");

  // Completed ceremonies (dates that have passed)
  const completedCeremonies = ceremonies.filter((c) => {
    const ceremonyDate = new Date(c.rawDate || c.date);
    return c.status === "Active" && ceremonyDate < new Date();
  });

  // Year-to-Date ceremonies (all ceremonies with dates in current year)
  const ytdCeremonies = ceremonies.filter((c) => {
    if (!c.rawDate) return false;
    const ceremonyDate = new Date(c.rawDate);
    return ceremonyDate.getFullYear() === currentYear;
  });

  // Completed ceremonies this year only
  const ytdCompletedCeremonies = ceremonies.filter((c) => {
    if (!c.rawDate) return false;
    const ceremonyDate = new Date(c.rawDate);
    return (
      ceremonyDate.getFullYear() === currentYear && ceremonyDate < currentDate
    );
  });

  // Get upcoming ceremonies within next 30 days, sorted by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  const upcomingCeremonies = activeCeremonies
    .filter((c) => {
      if (!c.rawDate) return false;
      const ceremonyDate = new Date(c.rawDate);
      ceremonyDate.setHours(0, 0, 0, 0);
      return ceremonyDate >= today && ceremonyDate <= thirtyDaysFromNow;
    })
    .sort(
      (a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()
    )
    .slice(0, 2);

  const coupleById = new Map((couples || []).map((couple) => [couple.id, couple]));

  const upcomingCalendarEvents: DashboardCalendarEvent[] = [
    ...activeCeremonies
      .filter((ceremony) => {
        const ceremonyDate = parseDateOnly(ceremony.rawDate);
        if (!ceremonyDate) return false;
        ceremonyDate.setHours(0, 0, 0, 0);
        return ceremonyDate >= today;
      })
      .map((ceremony) => ({
        id: `wedding-${ceremony.id}`,
        type: "wedding" as const,
        date: ceremony.rawDate,
        time: ceremony.time,
        title: `${(ceremony.couple1Name || "").split(" ")[0] || "Bride"} & ${
          (ceremony.couple2Name || "").split(" ")[0] || "Groom"
        } Wedding`,
        subtitle: `${ceremony.couple1Name} & ${ceremony.couple2Name}`,
        location: ceremony.location,
        coupleId: ceremony.id,
        ceremony,
      })),
    ...dashboardMeetings
      .filter((meeting) => {
        const meetingDate = parseDateOnly(meeting.date);
        if (!meetingDate) return false;
        meetingDate.setHours(0, 0, 0, 0);
        return (
          meetingDate >= today &&
          !["canceled", "declined", "completed"].includes(meeting.status)
        );
      })
      .map((meeting) => {
        const couple = coupleById.get(meeting.coupleId);
        const coupleNames = couple
          ? `${couple.brideName || "Bride"} & ${couple.groomName || "Groom"}`
          : "Wedding Couple";

        return {
          id: `meeting-${meeting.id}`,
          type: "meeting" as const,
          date: meeting.date,
          time: formatTime(meeting.time),
          title: meeting.title,
          subtitle: coupleNames,
          location: meeting.location,
          coupleId: meeting.coupleId.toString(),
          status: meeting.status,
        };
      }),
  ]
    .sort((a, b) => {
      const aDate = parseDateOnly(a.date)?.getTime() || 0;
      const bDate = parseDateOnly(b.date)?.getTime() || 0;
      if (aDate !== bDate) return aDate - bDate;
      return a.time.localeCompare(b.time);
    })
    .slice(0, 8);

  const handleCeremonyClick = (ceremonyId: string) => {
    onSelectCouple(ceremonyId);
    onOpenChange(false);
  };

  const handleAddCeremony = async () => {
    // 1️⃣ Validate required fields
    if (
      !newCeremony.ceremonyName ||
      !newCeremony.brideName ||
      !newCeremony.groomName
    ) {
      alert("Please fill in Ceremony Name, Bride Name, and Groom Name");
      return;
    }

    if (!user?.id) {
      alert("⚠️ Please sign in to save ceremony.");
      return;
    }

    setSaving(true);
    const savedCeremony = { ...newCeremony }; // save a copy before reset

    try {
      // 2️⃣ Prepare couple data
      const coupleData = {
        user_id: user.id,
        bride_name: newCeremony.brideName,
        bride_email: newCeremony.brideEmail || null,
        bride_phone: newCeremony.bridePhone || null,
        bride_address: newCeremony.brideAddress || null,
        groom_name: newCeremony.groomName,
        groom_email: newCeremony.groomEmail || null,
        groom_phone: newCeremony.groomPhone || null,
        groom_address: newCeremony.groomAddress || null,
        address: "",
        emergency_contact: "",
        special_requests: newCeremony.notes || null,
        is_active: true,
        colors: JSON.stringify(getCoupleColors(allCouples.length + 1)), // store JSON as string
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 3️⃣ Insert into couples table
      const { data: coupleInsert, error: coupleError } = await supabase
        .from("couples")
        .insert(coupleData)
        .select()
        .single();

      if (coupleError) throw coupleError;
      console.log("✅ Couple saved:", coupleInsert);

      // 4️⃣ Prepare ceremony data
      const ceremonyData = {
        couple_id: coupleInsert.id, // link ceremony to newly created couple
        user_id: user.id,
        venue_name: newCeremony.venueName || null,
        venue_address: newCeremony.venueAddress || null,
        wedding_date: newCeremony.ceremonyDate || null,
        start_time: newCeremony.ceremonyTime || null,
        end_time: null, // leave null if unknown
        expected_guests: newCeremony.expectedGuests || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 5️⃣ Insert into ceremonies table
      const { data: ceremonyInsert, error: ceremonyError } = await supabase
        .from("ceremonies")
        .insert(ceremonyData)
        .select()
        .single();

      if (ceremonyError) throw ceremonyError;
      console.log("✅ Ceremony saved:", ceremonyInsert);

      // 6️⃣ Update local state for UI
      setAllCouples((prev) => [...prev, coupleInsert]);
      setSavedCeremonies((prev) => [...prev, ceremonyInsert]);

      setNewCeremony({
        ceremonyName: "",
        ceremonyDate: "",
        ceremonyTime: "",
        venueName: "",
        venueAddress: "",
        expectedGuests: "",
        brideName: "",
        brideEmail: "",
        bridePhone: "",
        brideAddress: "",
        groomName: "",
        groomEmail: "",
        groomPhone: "",
        groomAddress: "",
        totalAmount: "",
        depositAmount: "",
        finalPaymentDate: "",
        notes: "",
      });

      setShowAddCeremonyDialog(false);
      alert(
        `Ceremony "${savedCeremony.ceremonyName}" for ${savedCeremony.brideName} & ${savedCeremony.groomName} has been saved successfully!`
      );
    } catch (err) {
      console.error("❌ Error saving ceremony or couple:", err);
      alert("⚠️ Failed to save ceremony. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleProfileUpdate = <K extends keyof OfficiantProfile>(
    field: K,
    value: OfficiantProfile[K]
  ) => {
    setProfile((prev) => {
      const updated = { ...prev, [field]: value };
      // ❌ REMOVED: localStorage.setItem("officiantProfile", JSON.stringify(updated));
      // ✅ Profile data will be saved to Supabase when user clicks "Save Profile"
      return updated;
    });
  };

  const handleSocialMediaUpdate = (platform: string, value: string) => {
    setProfile((prev) => {
      const updated = {
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [platform]: value,
        },
      };
      // ❌ REMOVED: localStorage.setItem("officiantProfile", JSON.stringify(updated));
      // ✅ Profile data will be saved to Supabase when user clicks "Save Profile"
      return updated;
    });
  };

  const handleProfileSubmit = async () => {
    try {
      if (!user?.id) {
        alert("⚠️ Please sign in before saving your profile.");
        return;
      }

      const profileData = {
        user_id: user.id,
        full_name: profile.fullName,
        business_name: profile.businessName || null,
        city: profile.city || null,
        state: profile.state || null,
        travel_radius_miles: profile.travelRadiusMiles || 0,
        travel_state: profile.travelState || profile.state || null,
        phone: profile.phone || null,
        email: profile.email,
        website: profile.website || null,
        bio: profile.bio || null,
        headshot_url: profile.headshot || null,
        years_experience: profile.yearsExperience || 0,
        price_min: profile.priceRange.min || 0,
        price_max: profile.priceRange.max || 0,
        social_facebook: profile.socialMedia.facebook || null,
        social_instagram: profile.socialMedia.instagram || null,
        social_linkedin: profile.socialMedia.linkedin || null,
        social_youtube: profile.socialMedia.youtube || null,
        photo_gallery: profile.photoGallery || [],
        video_url: profile.videoUrl || null,
        updated_at: new Date().toISOString(),
      };

      console.log("📝 Submitting profile:", profileData);

      // ✅ Upsert (insert or update)
      const { data, error } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "user_id" }) // ensures update if user_id exists
        .select()
        .single();

      if (error) throw error;

      console.log("✅ Supabase response:", data);
    } catch (err) {
      console.error("❌ Error saving profile:", err);
      alert("❌ Failed to save profile. Please try again.");
    }
  };

  const ensureBucketExists = async (bucketName: string) => {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;

    const exists = buckets.some((b: { name: string }) => b.name === bucketName);
    if (!exists) {
      const { error: createError } = await supabase.storage.createBucket(
        bucketName,
        {
          public: true,
        }
      );
      if (createError) throw createError;
      console.log(`✅ Created missing bucket: ${bucketName}`);
    }
  };
  const handleHeadshotUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      console.log("📤 Uploading headshot:", file.name, "Size:", file.size);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert("❌ Please upload an image file (JPG, PNG, etc.)");
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10485760) {
        alert("❌ Image must be under 10MB");
        return;
      }

      const bucket = "headshots";
      // ❌ REMOVED: await ensureBucketExists(bucket);
      // Buckets already exist, no need to check

      const filePath = `${user.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("❌ Upload error details:", uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      // Add cache-busting parameter to force browser to reload image
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      handleProfileUpdate("headshot", publicUrl);
      alert("✅ Headshot uploaded successfully! Click 'Save Profile' to save permanently.");
      console.log("✅ Headshot URL:", publicUrl);
    } catch (err: any) {
      console.error("❌ Headshot upload error:", err);
      const errorMsg = err?.message || err?.error || "Unknown error";
      alert(`❌ Failed to upload headshot.\n\nError: ${errorMsg}\n\nPlease check:\n- Supabase Storage is enabled\n- Storage buckets exist\n- Storage policies allow uploads`);
    }
  };

  // ✅ Gallery Upload
  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const files = e.target.files;
      if (!files?.length) return;

      console.log(`📤 Uploading ${files.length} gallery photos`);

      // Validate file types and sizes
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          alert(`❌ "${file.name}" is not an image file. Please upload only images.`);
          return;
        }
        if (file.size > 10485760) {
          alert(`❌ "${file.name}" is over 10MB. Please use smaller images.`);
          return;
        }
      }

      const bucket = "gallery";
      // ❌ REMOVED: await ensureBucketExists(bucket);
      // Buckets already exist, no need to check

      const uploadPromises = Array.from(files).map(async (file) => {
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.error(`❌ Upload error for ${file.name}:`, uploadError);
          throw uploadError;
        }
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        console.log(`✅ Uploaded ${file.name}:`, data.publicUrl);
        return data.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setProfile((prev) => ({
        ...prev,
        photoGallery: [...prev.photoGallery, ...urls],
      }));
    } catch (err: any) {
      console.error("❌ Gallery upload error:", err);
      const errorMsg = err?.message || err?.error || "Unknown error";
      alert(`❌ Failed to upload gallery images.\n\nError: ${errorMsg}\n\nPlease check:\n- Supabase Storage is enabled\n- Storage buckets exist\n- Storage policies allow uploads`);
    }
  };

  // ✅ Video Upload
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      console.log("📤 Uploading video:", file.name, "Size:", file.size);

      // Validate file type
      if (!file.type.startsWith('video/')) {
        alert("❌ Please upload a video file (MP4, MOV, etc.)");
        return;
      }

      // Validate file size (200MB max)
      if (file.size > 209715200) {
        alert("❌ Video must be under 200MB.");
        return;
      }

      const bucket = "videos";
      // ❌ REMOVED: await ensureBucketExists(bucket);
      // Buckets already exist, no need to check

      const filePath = `${user.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("❌ Video upload error details:", uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      handleProfileUpdate("videoUrl", data.publicUrl);
      console.log("✅ Video URL:", data.publicUrl);
    } catch (err: any) {
      console.error("❌ Video upload error:", err);
      const errorMsg = err?.message || err?.error || "Unknown error";
      alert(`❌ Failed to upload video.\n\nError: ${errorMsg}\n\nPlease check:\n- Supabase Storage is enabled\n- Storage buckets exist\n- Storage policies allow uploads`);
    }
  };

  const removeGalleryPhoto = (index: number) => {
    setProfile((prev) => {
      const updated = {
        ...prev,
        photoGallery: prev.photoGallery.filter((_, i) => i !== index),
      };
      // ❌ REMOVED: localStorage.setItem("officiantProfile", JSON.stringify(updated));
      // ✅ Gallery changes will be saved to Supabase when user clicks "Save Profile"
      return updated;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <VisuallyHidden>
        <DialogTitle>Hidden Accessible Title</DialogTitle>
      </VisuallyHidden>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] p-0 gap-0 overflow-hidden">
        <div className="flex h-full overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-white border-r border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">OrdainedPro</h2>
                <p className="text-xs text-gray-500">Officiant</p>
              </div>
            </div>

            <nav className="space-y-1">
              <Button
                variant={activeView === "dashboard" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveView("dashboard")}
              >
                <LayoutDashboard className="w-4 h-4 mr-3" />
                Dashboard
              </Button>
              <Button
                variant={activeView === "ceremonies" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveView("ceremonies")}
              >
                <Heart className="w-4 h-4 mr-3" />
                My Ceremonies
              </Button>
              <Button
                variant={activeView === "calendar" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveView("calendar")}
              >
                <CalendarIcon className="w-4 h-4 mr-3" />
                Calendar
              </Button>
              <Button
                variant={activeView === "profile" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveView("profile")}
              >
                <User className="w-4 h-4 mr-3" />
                My Profile
              </Button>
              <Button
                variant={activeView === "documents" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveView("documents")}
              >
                <FileText className="w-4 h-4 mr-3" />
                Documents
              </Button>
              <Button
                variant={activeView === "settings" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveView("settings")}
              >
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </Button>
            </nav>

            <div className="mt-auto pt-8">
              <div className="bg-blue-50 rounded-lg p-4 text-sm">
                <p className="font-medium text-blue-900">Need Help?</p>
                <a
                  href="mailto:info@ordainedpro.com"
                  className="mt-1 block text-xs text-blue-700 hover:text-blue-800 hover:underline"
                >
                  Contact support for assistance
                </a>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div
            className="flex-1 overflow-y-auto bg-gray-50"
            style={{ height: "100%", maxHeight: "90vh" }}
          >
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {officiantFirstName}!
                  </h1>
                  <p className="text-gray-600">
                    Manage your ceremonies and profile
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => setShowAddCeremonyDialog(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Ceremony
                  </Button>
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={user?.user_metadata?.avatar_url || ""}
                      alt={officiantFullName}
                    />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getInitials(officiantFullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {officiantFullName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {officiantLabel}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard View */}
            {activeView === "dashboard" && (
              <div className="p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Dashboard
                </h2>
                <p className="text-gray-600 mb-6">
                  Overview of your ceremonies and activities
                </p>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">
                            Total Ceremonies (YTD)
                          </p>
                          <p className="text-3xl font-bold text-gray-900">
                            {ytdCeremonies.length}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Year: {currentYear}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Heart className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">
                            Active Ceremonies
                          </p>
                          <p className="text-3xl font-bold text-gray-900">
                            {activeCeremonies.length}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            2 this week
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Clock className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600 text-sm">
                            Completed (YTD)
                          </p>
                          <p className="text-3xl font-bold text-gray-900">
                            {ytdCompletedCeremonies.length}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {ytdCeremonies.length -
                              ytdCompletedCeremonies.length}{" "}
                            upcoming
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <Heart className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Upcoming Ceremonies */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      Upcoming Ceremonies
                    </h3>
                    <p className="text-sm text-gray-500">Next 30 days</p>
                  </div>
                  <div className="space-y-4">
                    {upcomingCeremonies.map((ceremony) => (
                      <Card
                        key={ceremony.id}
                        className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                        onClick={() => handleCeremonyClick(ceremony.id)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex -space-x-2">
                                <Avatar className="border-2 border-white">
                                  <AvatarFallback
                                    className={ceremony.couple1Color}
                                  >
                                    {ceremony.couple1Initial}
                                  </AvatarFallback>
                                </Avatar>
                                <Avatar className="border-2 border-white">
                                  <AvatarFallback
                                    className={ceremony.couple2Color}
                                  >
                                    {ceremony.couple2Initial}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="font-semibold text-gray-900">
                                    {(ceremony.couple1Name || "").split(" ")[0] || "Bride"} &{" "}
                                    {(ceremony.couple2Name || "").split(" ")[0] || "Groom"}
                                  </p>
                                  <Badge
                                    className={
                                      ceremony.status === "Active"
                                        ? "bg-green-500"
                                        : "bg-red-500"
                                    }
                                  >
                                    {ceremony.status === "Active"
                                      ? "Active Ceremony"
                                      : "Archived Ceremony"}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                  <span className="flex items-center">
                                    <CalendarIcon className="w-4 h-4 mr-1" />
                                    {ceremony.date}
                                  </span>
                                  <span>{ceremony.time}</span>
                                  <span className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {ceremony.location}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-blue-600 font-medium">
                                {ceremony.rawDate
                                  ? getDaysUntilCeremony(ceremony.rawDate)
                                  : "Date TBD"}
                              </p>
                              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto mt-2" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* My Ceremonies View */}
            {activeView === "ceremonies" && (
              <div className="p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  My Ceremonies
                </h2>
                <p className="text-gray-600 mb-6">
                  Search and manage all your wedding ceremonies
                </p>

                {/* Filter Tabs */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex space-x-2">
                    <Button
                      variant={
                        ceremonyFilter === "Active" ? "default" : "outline"
                      }
                      className={
                        ceremonyFilter === "Active"
                          ? "bg-green-500 hover:bg-green-600"
                          : ""
                      }
                      onClick={() => setCeremonyFilter("Active")}
                    >
                      Active
                    </Button>
                    <Button
                      variant={
                        ceremonyFilter === "Archived" ? "default" : "outline"
                      }
                      onClick={() => setCeremonyFilter("Archived")}
                    >
                      Archived
                    </Button>
                    <Button
                      variant={ceremonyFilter === "All" ? "default" : "outline"}
                      onClick={() => setCeremonyFilter("All")}
                    >
                      All
                    </Button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, phone, date, or location..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Ceremony Cards */}
                <div className="space-y-4">
                  {filteredCeremonies.map((ceremony) => (
                    <Card
                      key={ceremony.id}
                      className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                      onClick={() => handleCeremonyClick(ceremony.id)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex -space-x-2">
                              <Avatar className="border-2 border-white">
                                <AvatarFallback
                                  className={ceremony.couple1Color}
                                >
                                  {ceremony.couple1Initial}
                                </AvatarFallback>
                              </Avatar>
                              <Avatar className="border-2 border-white">
                                <AvatarFallback
                                  className={ceremony.couple2Color}
                                >
                                  {ceremony.couple2Initial}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-semibold text-gray-900">
                                  {ceremony.couple1Name.split(" ")[0]} &{" "}
                                  {ceremony.couple2Name.split(" ")[0]}
                                </p>
                                <Badge
                                  className={
                                    ceremony.status === "Active"
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                  }
                                >
                                  {ceremony.status === "Active"
                                    ? "Active Ceremony"
                                    : "Archived Ceremony"}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <CalendarIcon className="w-4 h-4 mr-1" />
                                  {ceremony.date}
                                </span>
                                <span className="flex items-center">
                                  <Mail className="w-4 h-4 mr-1" />
                                  {ceremony.email}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {ceremony.location}
                              </span>
                              <span className="flex items-center">
                                <Phone className="w-4 h-4 mr-1" />
                                {ceremony.phone}
                              </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 ml-auto mt-2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar View */}
            {activeView === "calendar" && (
              <div className="p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Calendar
                </h2>
                <p className="text-gray-600 mb-6">
                  View and manage your ceremony schedule
                </p>

                <div className="grid grid-cols-3 gap-6">
                  {/* Calendar */}
                  <div className="col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {(selectedDate || new Date()).toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          className="rounded-md border"
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {/* Upcoming Events */}
                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle>Upcoming Dates</CardTitle>
                        <CardDescription>
                          Weddings and scheduled meetings
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {upcomingCalendarEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`p-4 rounded-lg transition-colors ${
                              event.type === "wedding"
                                ? "bg-purple-50 hover:bg-purple-100 cursor-pointer"
                                : "bg-blue-50"
                            }`}
                            onClick={() =>
                              event.type === "wedding" && event.coupleId
                                ? handleCeremonyClick(event.coupleId)
                                : undefined
                            }
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <CalendarIcon
                                className={`w-4 h-4 ${
                                  event.type === "wedding"
                                    ? "text-purple-600"
                                    : "text-blue-600"
                                }`}
                              />
                              <p
                                className={`text-sm font-medium ${
                                  event.type === "wedding"
                                    ? "text-purple-900"
                                    : "text-blue-900"
                                }`}
                              >
                                {formatDateOnly(event.date)}
                              </p>
                              <Badge
                                variant="outline"
                                className={
                                  event.type === "wedding"
                                    ? "border-purple-200 text-purple-700"
                                    : "border-blue-200 text-blue-700"
                                }
                              >
                                {event.type === "wedding" ? "Wedding" : "Meeting"}
                              </Badge>
                            </div>
                            {event.type === "wedding" && event.ceremony && (
                              <div className="flex -space-x-2 mb-2">
                                <Avatar className="border-2 border-white w-8 h-8">
                                  <AvatarFallback
                                    className={event.ceremony.couple1Color}
                                  >
                                    {event.ceremony.couple1Initial}
                                  </AvatarFallback>
                                </Avatar>
                                <Avatar className="border-2 border-white w-8 h-8">
                                  <AvatarFallback
                                    className={event.ceremony.couple2Color}
                                  >
                                    {event.ceremony.couple2Initial}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            )}
                            <p className="text-sm font-semibold text-gray-900">
                              {event.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {event.subtitle}
                            </p>
                            <p className="text-xs text-gray-600 flex items-center mt-1">
                              <Clock className="w-3 h-3 mr-1" />
                              {event.time || "Time TBD"}
                            </p>
                            {event.location && event.location !== "TBD" && (
                              <p className="text-xs text-gray-600 flex items-center mt-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                {event.location}
                              </p>
                            )}
                          </div>
                        ))}
                        {upcomingCalendarEvents.length === 0 && (
                          <div className="p-4 bg-gray-50 rounded-lg text-center">
                            <p className="text-sm text-gray-500">
                              No upcoming weddings or meetings.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}

            {/* My Profile View */}
            {activeView === "profile" && (
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    My Public Profile
                  </h2>
                  <p className="text-gray-600">
                    Manage your professional profile that couples will see when
                    searching for officiants
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column - Profile Preview */}
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm text-gray-600">
                          Profile Preview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Headshot */}
                        <div className="flex justify-center">
                          <div className="relative">
                            <Avatar className="w-32 h-32" key={profile.headshot || 'no-headshot'}>
                              {profile.headshot ? (
                                <AvatarImage src={profile.headshot} key={profile.headshot} />
                              ) : (
                                <AvatarFallback className="bg-blue-600 text-white text-3xl">
                                  {getInitials(officiantFullName)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          </div>
                        </div>

                        {/* Name & Location */}
                        <div className="text-center">
                          <h3 className="font-bold text-lg text-gray-900">
                            {officiantFullName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {[profile.city, profile.state].filter(Boolean).join(", ")}
                          </p>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center justify-center space-x-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(profile.rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold text-gray-900">
                            {profile.rating.toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({profile.totalReviews} reviews)
                          </span>
                        </div>

                        {/* Experience Badge */}
                        <div className="flex justify-center">
                          <Badge className="bg-blue-100 text-blue-800">
                            {profile.yearsExperience}{" "}
                            {profile.yearsExperience === 1 ? "Year" : "Years"}{" "}
                            Experience
                          </Badge>
                        </div>

                        {/* Price Range */}
                        <div className="text-center py-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">
                            Price Range
                          </p>
                          <p className="font-bold text-green-700 text-lg">
                            ${profile.priceRange.min} - $
                            {profile.priceRange.max}
                          </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">
                              {profile.photoGallery.length}
                            </p>
                            <p className="text-xs text-gray-500">Photos</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">
                              {profile.videoUrl ? "1" : "0"}
                            </p>
                            <p className="text-xs text-gray-500">Video</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Profile Edit Forms */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border-blue-200 bg-blue-50/70">
                      <CardHeader>
                        <CardTitle className="flex items-center text-blue-900">
                          <LinkIcon className="w-5 h-5 mr-2" />
                          Public Profile Window
                        </CardTitle>
                        <CardDescription className="text-blue-800">
                          Share this compact public profile with couples or add it to your website, email signature, and social media.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Input
                            readOnly
                            aria-label="Public profile URL"
                            value={publicProfileUrl}
                            className="h-9 bg-white text-xs sm:max-w-[300px]"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="border-blue-300 bg-white text-blue-700 hover:bg-blue-100"
                            onClick={handleCopyPublicProfileUrl}
                            disabled={!user?.id}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            {publicProfileCopied ? "Copied" : "Copy"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-blue-300 bg-white text-blue-700 hover:bg-blue-100"
                            onClick={handleSharePublicProfileByEmail}
                            disabled={!user?.id}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Share
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="border-blue-300 bg-white text-blue-700 hover:bg-blue-100"
                            onClick={() => window.open(publicProfilePath, "_blank", "noopener,noreferrer")}
                            disabled={!user?.id}
                          >
                            <Globe className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
                          Public profile notice: information saved in this profile may be displayed publicly, including your name,
                          business name, contact information, website, social media links, pricing, travel details, bio, photos, and videos.
                          The public page is designed as a short profile window, but only upload or save information and media that you are comfortable sharing with couples and search engines.
                        </div>
                      </CardContent>
                    </Card>

                    {/* Basic Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>
                          Your professional details and headshot
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="headshot">
                            Professional Headshot
                          </Label>
                          <div className="flex items-center space-x-4 mt-2">
                            <Avatar className="w-20 h-20" key={profile.headshot || 'no-headshot'}>
                              {profile.headshot ? (
                                <AvatarImage src={profile.headshot} key={profile.headshot} />
                              ) : (
                                <AvatarFallback className="bg-blue-600 text-white text-xl">
                                  {profile.fullName
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <label htmlFor="headshot-upload">
                              <Button variant="outline" asChild>
                                <span>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Headshot
                                </span>
                              </Button>
                            </label>
                            <input
                              id="headshot-upload"
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleHeadshotUpload}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            value={profile.fullName}
                            onChange={(e) =>
                              handleProfileUpdate("fullName", e.target.value)
                            }
                            placeholder="Your full professional name"
                          />
                        </div>

                        <div>
                          <Label htmlFor="businessName">Business Name</Label>
                          <Input
                            id="businessName"
                            value={profile.businessName}
                            onChange={(e) =>
                              handleProfileUpdate(
                                "businessName",
                                e.target.value
                              )
                            }
                            placeholder="Your business or ministry name"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            This name will appear on all invoices and official
                            documents
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={profile.city}
                              onChange={(e) =>
                                handleProfileUpdate("city", e.target.value)
                              }
                              placeholder="City"
                            />
                          </div>
                          <div>
                            <Label htmlFor="state">State</Label>
                            <Input
                              id="state"
                              value={profile.state}
                              onChange={(e) =>
                                handleProfileUpdate("state", e.target.value)
                              }
                              placeholder="State"
                              maxLength={2}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="yearsExperience">
                            Years of Experience
                          </Label>
                          <Input
                            id="yearsExperience"
                            type="number"
                            value={profile.yearsExperience}
                            onChange={(e) =>
                              handleProfileUpdate(
                                "yearsExperience",
                                parseInt(e.target.value) || 0
                              )
                            }
                            placeholder="Number of years officiating"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="travelRadiusMiles">Travel Radius (Miles)</Label>
                            <Input
                              id="travelRadiusMiles"
                              type="number"
                              value={profile.travelRadiusMiles}
                              onChange={(e) =>
                                handleProfileUpdate(
                                  "travelRadiusMiles",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              placeholder="50"
                            />
                          </div>
                          <div>
                            <Label htmlFor="travelState">Travel State</Label>
                            <Input
                              id="travelState"
                              value={profile.travelState}
                              onChange={(e) =>
                                handleProfileUpdate("travelState", e.target.value)
                              }
                              placeholder={profile.state || "AZ"}
                              maxLength={2}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          This appears on your public officiant page so couples know how far you are willing to travel.
                        </p>
                      </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                        <CardDescription>
                          How couples can reach you
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              id="phone"
                              type="tel"
                              value={profile.phone}
                              onChange={(e) =>
                                handleProfileUpdate("phone", e.target.value)
                              }
                              placeholder="(555) 123-4567"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              id="email"
                              type="email"
                              value={profile.email}
                              onChange={(e) =>
                                handleProfileUpdate("email", e.target.value)
                              }
                              placeholder="your@email.com"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="website">Website</Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                              id="website"
                              type="url"
                              value={profile.website}
                              onChange={(e) =>
                                handleProfileUpdate("website", e.target.value)
                              }
                              placeholder="https://yourwebsite.com"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <Label className="mb-3 block">Social Media</Label>
                          <div className="space-y-3">
                            <div className="relative">
                              <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                value={profile.socialMedia.facebook}
                                onChange={(e) =>
                                  handleSocialMediaUpdate(
                                    "facebook",
                                    e.target.value
                                  )
                                }
                                placeholder="Facebook profile URL"
                                className="pl-10"
                              />
                            </div>
                            <div className="relative">
                              <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                value={profile.socialMedia.instagram}
                                onChange={(e) =>
                                  handleSocialMediaUpdate(
                                    "instagram",
                                    e.target.value
                                  )
                                }
                                placeholder="Instagram handle or URL"
                                className="pl-10"
                              />
                            </div>
                            <div className="relative">
                              <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                value={profile.socialMedia.linkedin}
                                onChange={(e) =>
                                  handleSocialMediaUpdate(
                                    "linkedin",
                                    e.target.value
                                  )
                                }
                                placeholder="LinkedIn profile URL"
                                className="pl-10"
                              />
                            </div>
                            <div className="relative">
                              <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                value={profile.socialMedia.youtube}
                                onChange={(e) =>
                                  handleSocialMediaUpdate(
                                    "youtube",
                                    e.target.value
                                  )
                                }
                                placeholder="YouTube channel URL"
                                className="pl-10"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pricing */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Pricing Information</CardTitle>
                        <CardDescription>
                          Your service price range
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="priceMin">Minimum Price ($)</Label>
                            <Input
                              id="priceMin"
                              type="number"
                              value={profile.priceRange.min}
                              onChange={(e) =>
                                handleProfileUpdate("priceRange", {
                                  ...profile.priceRange,
                                  min: parseInt(e.target.value) || 0,
                                })
                              }
                              placeholder="300"
                            />
                          </div>
                          <div>
                            <Label htmlFor="priceMax">Maximum Price ($)</Label>
                            <Input
                              id="priceMax"
                              type="number"
                              value={profile.priceRange.max}
                              onChange={(e) =>
                                handleProfileUpdate("priceRange", {
                                  ...profile.priceRange,
                                  max: parseInt(e.target.value) || 0,
                                })
                              }
                              placeholder="800"
                            />
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          This range will be displayed to couples searching for
                          officiants in your area
                        </p>
                      </CardContent>
                    </Card>

                    {/* Bio */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Professional Bio</CardTitle>
                        <CardDescription>
                          Tell couples about your experience and approach
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={profile.bio}
                          onChange={(e) =>
                            handleProfileUpdate("bio", e.target.value)
                          }
                          placeholder="Write a compelling bio that helps couples understand your style, experience, and what makes you unique as an officiant..."
                          rows={8}
                          className="min-h-[200px]"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          {profile.bio.length} characters
                        </p>
                      </CardContent>
                    </Card>

                    {/* Photo Gallery */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Photo Gallery</CardTitle>
                        <CardDescription>
                          Upload photos of ceremonies you've officiated
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label htmlFor="gallery-upload">
                            <Button
                              variant="outline"
                              className="w-full"
                              asChild
                            >
                              <span>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Photos
                              </span>
                            </Button>
                          </label>
                          <input
                            id="gallery-upload"
                            type="file"
                            multiple
                            className="hidden"
                            accept="image/*"
                            onChange={handleGalleryUpload}
                          />
                        </div>

                        {profile.photoGallery.length > 0 && (
                          <div className="grid grid-cols-3 gap-4">
                            {profile.photoGallery.map((photo, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={photo}
                                  alt={`Gallery photo ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                                <button
                                  onClick={() => removeGalleryPhoto(index)}
                                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {profile.photoGallery.length === 0 && (
                          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">
                              No photos uploaded yet
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Video Upload */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Introduction Video</CardTitle>
                        <CardDescription>
                          Upload a video introducing yourself (max 200MB)
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {!profile.videoUrl ? (
                          <div>
                            <label htmlFor="video-upload">
                              <Button
                                variant="outline"
                                className="w-full"
                                asChild
                              >
                                <span>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Upload Video (Max 200MB)
                                </span>
                              </Button>
                            </label>
                            <input
                              id="video-upload"
                              type="file"
                              className="hidden"
                              accept="video/*"
                              onChange={handleVideoUpload}
                            />
                          </div>
                        ) : (
                          <div>
                            <video
                              src={profile.videoUrl}
                              controls
                              className="w-full rounded-lg"
                            />
                            <Button
                              variant="destructive"
                              onClick={() =>
                                handleProfileUpdate("videoUrl", "")
                              }
                              className="w-full mt-3"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove Video
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <Button
                        onClick={handleProfileSubmit}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Profile Changes
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Documents View */}
            {activeView === "documents" && (
              <div className="p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Documents
                </h2>
                <p className="text-gray-600 mb-6">
                  Review and manage your uploaded contracts
                </p>

                {/* Documents Grid */}
                <div className="grid grid-cols-1 gap-4 mb-6 lg:grid-cols-2">
                  {documentsData.length === 0 && (
                    <Card className="lg:col-span-2 border-dashed border-gray-300">
                      <CardContent className="py-12 text-center">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="font-medium text-gray-900 mb-1">
                          No contracts uploaded yet
                        </p>
                        <p className="text-sm text-gray-500">
                          Uploaded contracts will appear here automatically.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                  {documentsData.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start space-x-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                doc.type === "PDF"
                                  ? "bg-blue-100"
                                  : doc.type === "DOC" || doc.type === "DOCX"
                                  ? "bg-green-100"
                                  : doc.type === "TXT"
                                  ? "bg-emerald-100"
                                  : "bg-purple-100"
                              }`}
                            >
                              <FileText
                                className={`w-5 h-5 ${
                                  doc.type === "PDF"
                                    ? "text-blue-600"
                                    : doc.type === "DOC" || doc.type === "DOCX"
                                    ? "text-green-600"
                                    : doc.type === "TXT"
                                    ? "text-emerald-600"
                                    : "text-purple-600"
                                }`}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900 text-sm">
                                  {doc.name}
                                </p>
                                {doc.status && (
                                  <Badge variant="outline" className="text-xs">
                                    {doc.status}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {doc.type} • {doc.size}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Updated {doc.updated}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            title="View document"
                            aria-label={`View ${doc.name}`}
                            className="h-9 justify-start rounded-lg bg-blue-50 px-3 text-xs text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                            onClick={() => onDocumentView?.(doc.id)}
                          >
                            <Eye className="w-4 h-4" />
                            <span className="ml-2">View</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Edit document"
                            aria-label={`Edit ${doc.name}`}
                            className="h-9 justify-start rounded-lg bg-purple-50 px-3 text-xs text-purple-600 hover:bg-purple-100 hover:text-purple-700"
                            onClick={() => onDocumentEdit?.(doc.id)}
                          >
                            <Pencil className="w-4 h-4" />
                            <span className="ml-2">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Delete document"
                            aria-label={`Delete ${doc.name}`}
                            className="h-9 justify-start rounded-lg bg-red-50 px-3 text-xs text-red-600 hover:bg-red-100 hover:text-red-700"
                            onClick={() => onDocumentDelete?.(doc.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="ml-2">Delete</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Download document"
                            aria-label={`Download ${doc.name}`}
                            className="h-9 justify-start rounded-lg bg-green-50 px-3 text-xs text-green-600 hover:bg-green-100 hover:text-green-700"
                            onClick={() => onDocumentDownload?.(doc.id)}
                          >
                            <Download className="w-4 h-4" />
                            <span className="ml-2">Download</span>
                          </Button>
                          {doc.source === "user_file" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="Add document to an active couple"
                              aria-label={`Add ${doc.name} to a couple`}
                              className="col-span-2 h-9 justify-start rounded-lg bg-pink-50 px-3 text-xs text-pink-600 hover:bg-pink-100 hover:text-pink-700"
                              onClick={() => {
                                setDocumentToAssign(doc.id);
                                setAssignCoupleId("");
                              }}
                            >
                              <Plus className="w-4 h-4" />
                              <span className="ml-2">Add to Couple</span>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Dialog open={Boolean(documentToAssign)} onOpenChange={(open) => !open && setDocumentToAssign(null)}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Script to Couple</DialogTitle>
                      <DialogDescription>
                        Choose an active couple. The script will be copied into that couple's files.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="assign-couple">Active couple</Label>
                        <select
                          id="assign-couple"
                          className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                          value={assignCoupleId}
                          onChange={(event) => setAssignCoupleId(event.target.value)}
                        >
                          <option value="">Select a couple</option>
                          {(couples || [])
                            .filter((couple) => couple.isActive !== false)
                            .map((couple) => (
                              <option key={couple.id} value={couple.id}>
                                {couple.brideName} & {couple.groomName}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDocumentToAssign(null)}>
                          Cancel
                        </Button>
                        <Button
                          disabled={!assignCoupleId || !documentToAssign}
                          onClick={() => {
                            if (!documentToAssign || !assignCoupleId) return;
                            onDocumentAssignToCouple?.(documentToAssign, Number(assignCoupleId));
                            setDocumentToAssign(null);
                          }}
                          className="bg-pink-500 hover:bg-pink-600"
                        >
                          Add to Couple
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

              </div>
            )}

            {/* Settings View */}
            {activeView === "settings" && (
              <div className="p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Settings
                </h2>
                <p className="text-gray-600 mb-6">
                  Manage your subscription and account preferences
                </p>

                {/* Subscription Management Section */}
                <div className="max-w-4xl">
                  <Card className="border-2 border-blue-200 shadow-lg mb-6">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center space-x-2 text-xl">
                            {isProfessional ? (
                              <Crown className="w-6 h-6 text-yellow-500" />
                            ) : (
                              <Star className="w-6 h-6 text-blue-500" />
                            )}
                            <span>
                              Current Plan:{" "}
                              {subscription?.tier === "professional"
                                ? "Professional"
                                : "Aspirant"}
                            </span>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {isProfessional
                              ? "You have full access to all features"
                              : "Upgrade to unlock all features"}
                          </CardDescription>
                        </div>
                        {isAspirant && (
                          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Upgrade Now
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {/* Current Plan Details */}
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">
                          Plan Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-1">
                              Ceremonies Limit
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                              {subscription?.limits.max_ceremonies === -1
                                ? "Unlimited"
                                : subscription?.limits.max_ceremonies}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-1">
                              Scripts Limit
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                              {subscription?.limits.max_scripts === -1
                                ? "Unlimited"
                                : subscription?.limits.max_scripts}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Feature Access */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-3">
                          Feature Access
                        </h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                          {subscription &&
                            Object.entries(subscription.features).map(
                              ([feature, hasAccess]) => (
                                <div
                                  key={feature}
                                  className="flex items-center space-x-2"
                                >
                                  {hasAccess ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <X className="w-5 h-5 text-gray-300" />
                                  )}
                                  <span
                                    className={
                                      hasAccess
                                        ? "text-gray-900"
                                        : "text-gray-400"
                                    }
                                  >
                                    {feature
                                      .split("_")
                                      .map(
                                        (word) =>
                                          word.charAt(0).toUpperCase() +
                                          word.slice(1)
                                      )
                                      .join(" ")}
                                  </span>
                                </div>
                              )
                            )}
                        </div>
                      </div>

                      {/* Subscription Management Actions */}
                      {isProfessional && (
                        <div className="mt-6 pt-6 border-t">
                          <h3 className="font-semibold text-gray-900 mb-3">
                            Manage Subscription
                          </h3>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              variant="outline"
                              className="border-blue-500 text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                alert("Redirecting to billing portal...");
                                // Add Stripe billing portal redirect here
                              }}
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Update Payment Method
                            </Button>
                            <Button
                              variant="outline"
                              className="border-red-500 text-red-700 hover:bg-red-50"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Are you sure you want to cancel your Professional subscription?\n\nYou will lose access to:\n• Unlimited ceremonies\n• Messages & files\n• Contracts & invoices\n• Marketplace access\n\nYour subscription will remain active until the end of your billing period."
                                  )
                                ) {
                                  alert(
                                    "Your cancellation request has been processed.\n\nYour Professional features will remain active until the end of your current billing period.\n\nWe're sorry to see you go!"
                                  );
                                }
                              }}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel Subscription
                            </Button>
                          </div>
                          <p className="text-sm text-gray-500 mt-3">
                            Your subscription will renew on{" "}
                            <strong>December 27, 2024</strong> for{" "}
                            <strong>$29.00/month</strong>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Pricing Comparison - Only show for Aspirant users */}
                  {isAspirant && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Upgrade Your Plan
                      </h3>
                      <div className="grid grid-cols-2 gap-6">
                        {/* Aspirant Plan */}
                        <Card className="border-2 border-blue-500 shadow-lg">
                          <CardHeader>
                            <div className="flex items-center justify-between mb-2">
                              <CardTitle className="text-lg">
                                Aspirant
                              </CardTitle>
                              <Badge className="bg-blue-500 text-white">
                                Current Plan
                              </Badge>
                            </div>
                            <div className="mt-2">
                              <span className="text-4xl font-bold text-gray-900">
                                $14.95
                              </span>
                              <span className="text-gray-600">/month</span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-start space-x-2">
                                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                                <span className="text-sm text-gray-700">
                                  Up to 3 ceremonies
                                </span>
                              </div>
                              <div className="flex items-start space-x-2">
                                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                                <span className="text-sm text-gray-700">
                                  Script builder access
                                </span>
                              </div>
                              <div className="flex items-start space-x-2">
                                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                                <span className="text-sm text-gray-700">
                                  Basic scheduling
                                </span>
                              </div>
                              <div className="flex items-start space-x-2">
                                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                                <span className="text-sm text-gray-700">
                                  Profile management
                                </span>
                              </div>
                              <div className="flex items-start space-x-2">
                                <X className="w-5 h-5 text-gray-300 mt-0.5" />
                                <span className="text-sm text-gray-400">
                                  Messages & files
                                </span>
                              </div>
                              <div className="flex items-start space-x-2">
                                <X className="w-5 h-5 text-gray-300 mt-0.5" />
                                <span className="text-sm text-gray-400">
                                  Invoices & payments
                                </span>
                              </div>
                              <div className="flex items-start space-x-2">
                                <X className="w-5 h-5 text-gray-300 mt-0.5" />
                                <span className="text-sm text-gray-400">
                                  Marketplace access
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Professional Plan */}
                        <Card className="border-2 border-purple-500 shadow-lg relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1">
                            POPULAR
                          </div>
                          <CardHeader>
                            <div className="flex items-center justify-between mb-2">
                              <CardTitle className="text-lg flex items-center space-x-2">
                                <Crown className="w-5 h-5 text-yellow-500" />
                                <span>Professional</span>
                              </CardTitle>
                            </div>
                            <div className="mt-2">
                              <span className="text-4xl font-bold text-gray-900">
                                $29
                              </span>
                              <span className="text-gray-600">/month</span>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3 mb-6">
                              <div className="flex items-start space-x-2">
                                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                                <span className="text-sm text-gray-700">
                                  <strong>Unlimited</strong> ceremonies
                                </span>
                              </div>
                              <div className="flex items-start space-x-2">
                                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                                <span className="text-sm text-gray-700">
                                  Advanced script builder
                                </span>
                              </div>
                              <div className="flex items-start space-x-2">
                                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                                <span className="text-sm text-gray-700">
                                  Full messaging system
                                </span>
                              </div>
                              <div className="flex items-start space-x-2">
                                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                                <span className="text-sm text-gray-700">
                                  Contract management
                                </span>
                              </div>
                              <div className="flex items-start space-x-2">
                                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                                <span className="text-sm text-gray-700">
                                  Invoice & payment tracking
                                </span>
                              </div>
                              <div className="flex items-start space-x-2">
                                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                                <span className="text-sm text-gray-700">
                                  Earnings dashboard
                                </span>
                              </div>
                              <div className="flex items-start space-x-2">
                                <Check className="w-5 h-5 text-green-500 mt-0.5" />
                                <span className="text-sm text-gray-700">
                                  Marketplace script sales
                                </span>
                              </div>
                            </div>
                            <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                              <Crown className="w-4 h-4 mr-2" />
                              Upgrade to Professional
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Ceremony Dialog - Mirrors Communication Portal */}
        <Dialog
          open={showAddCeremonyDialog}
          onOpenChange={setShowAddCeremonyDialog}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Wedding Ceremony</DialogTitle>
              <DialogDescription>
                Fill in the details for the new wedding ceremony you'll be
                officiating.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Ceremony Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-900">
                  Ceremony Details
                </h3>

                <div>
                  <Label htmlFor="ceremonyName">Ceremony Name</Label>
                  <Input
                    id="ceremonyName"
                    value={newCeremony.ceremonyName}
                    onChange={(e) =>
                      setNewCeremony({
                        ...newCeremony,
                        ceremonyName: e.target.value,
                      })
                    }
                    placeholder="e.g., Sarah & David's Wedding"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="ceremonyDate">Date</Label>
                    <Input
                      id="ceremonyDate"
                      type="date"
                      value={newCeremony.ceremonyDate}
                      onChange={(e) =>
                        setNewCeremony({
                          ...newCeremony,
                          ceremonyDate: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="ceremonyTime">Time</Label>
                    <Input
                      id="ceremonyTime"
                      type="time"
                      value={newCeremony.ceremonyTime}
                      onChange={(e) =>
                        setNewCeremony({
                          ...newCeremony,
                          ceremonyTime: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="venueName">Venue Name</Label>
                  <Input
                    id="venueName"
                    value={newCeremony.venueName}
                    onChange={(e) =>
                      setNewCeremony({
                        ...newCeremony,
                        venueName: e.target.value,
                      })
                    }
                    placeholder="e.g., Sunset Gardens"
                  />
                </div>

                <div>
                  <Label htmlFor="venueAddress">Venue Address</Label>
                  <Input
                    id="venueAddress"
                    value={newCeremony.venueAddress}
                    onChange={(e) =>
                      setNewCeremony({
                        ...newCeremony,
                        venueAddress: e.target.value,
                      })
                    }
                    placeholder="Full venue address"
                  />
                </div>

                <div>
                  <Label htmlFor="expectedGuests">Expected Guests</Label>
                  <Input
                    id="expectedGuests"
                    type="number"
                    value={newCeremony.expectedGuests}
                    onChange={(e) =>
                      setNewCeremony({
                        ...newCeremony,
                        expectedGuests: e.target.value,
                      })
                    }
                    placeholder="Number of guests"
                  />
                </div>
              </div>

              {/* Couple Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-900">
                  Couple Information
                </h3>

                {/* Bride Information */}
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h4 className="font-medium text-pink-900 mb-3">
                    Bride Information
                  </h4>
                  <div className="space-y-3">
                    <Input
                      value={newCeremony.brideName}
                      onChange={(e) =>
                        setNewCeremony({
                          ...newCeremony,
                          brideName: e.target.value,
                        })
                      }
                      placeholder="Bride's full name"
                    />
                    <Input
                      type="email"
                      value={newCeremony.brideEmail}
                      onChange={(e) =>
                        setNewCeremony({
                          ...newCeremony,
                          brideEmail: e.target.value,
                        })
                      }
                      placeholder="Bride's email"
                    />
                    <Input
                      type="tel"
                      value={newCeremony.bridePhone}
                      onChange={(e) =>
                        setNewCeremony({
                          ...newCeremony,
                          bridePhone: e.target.value,
                        })
                      }
                      placeholder="Bride's phone"
                    />
                    <Input
                      value={newCeremony.brideAddress}
                      onChange={(e) =>
                        setNewCeremony({
                          ...newCeremony,
                          brideAddress: e.target.value,
                        })
                      }
                      placeholder="Bride's primary address"
                    />
                  </div>
                </div>

                {/* Groom Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-3">
                    Groom Information
                  </h4>
                  <div className="space-y-3">
                    <Input
                      value={newCeremony.groomName}
                      onChange={(e) =>
                        setNewCeremony({
                          ...newCeremony,
                          groomName: e.target.value,
                        })
                      }
                      placeholder="Groom's full name"
                    />
                    <Input
                      type="email"
                      value={newCeremony.groomEmail}
                      onChange={(e) =>
                        setNewCeremony({
                          ...newCeremony,
                          groomEmail: e.target.value,
                        })
                      }
                      placeholder="Groom's email"
                    />
                    <Input
                      type="tel"
                      value={newCeremony.groomPhone}
                      onChange={(e) =>
                        setNewCeremony({
                          ...newCeremony,
                          groomPhone: e.target.value,
                        })
                      }
                      placeholder="Groom's phone"
                    />
                    <Input
                      value={newCeremony.groomAddress}
                      onChange={(e) =>
                        setNewCeremony({
                          ...newCeremony,
                          groomAddress: e.target.value,
                        })
                      }
                      placeholder="Groom's primary address"
                    />
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-3">
                    Payment Information
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        value={newCeremony.totalAmount}
                        onChange={(e) =>
                          setNewCeremony({
                            ...newCeremony,
                            totalAmount: e.target.value,
                          })
                        }
                        placeholder="Total amount ($)"
                      />
                      <Input
                        type="number"
                        value={newCeremony.depositAmount}
                        onChange={(e) =>
                          setNewCeremony({
                            ...newCeremony,
                            depositAmount: e.target.value,
                          })
                        }
                        placeholder="Deposit amount ($)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="finalPaymentDate">
                        Final Payment Due Date
                      </Label>
                      <Input
                        id="finalPaymentDate"
                        type="date"
                        value={newCeremony.finalPaymentDate}
                        onChange={(e) =>
                          setNewCeremony({
                            ...newCeremony,
                            finalPaymentDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Input
                    id="notes"
                    value={newCeremony.notes}
                    onChange={(e) =>
                      setNewCeremony({ ...newCeremony, notes: e.target.value })
                    }
                    placeholder="Special requests, preferences, etc."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddCeremonyDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCeremony}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Save className="w-4 h-4 mr-2" />
                Create Ceremony
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </DialogContent>
    </Dialog>
  );
}
