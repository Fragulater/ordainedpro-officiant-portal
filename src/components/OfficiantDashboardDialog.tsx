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
import { CancelSubscriptionDialog } from "@/components/CancelSubscriptionDialog";
import { UpgradeSubscriptionDialog } from "@/components/UpgradeSubscriptionDialog";
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
  AlertTriangle,
  Shield,
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

interface OfficiantDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCouple: (ceremonyId: string) => void;
  couples?: Couple[];
  onAddCeremony?: (newCouple: Partial<Couple>) => void;
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
  initialView = "dashboard",
}: OfficiantDashboardDialogProps) {
  // Subscription information
  const {
    subscription,
    isProfessional,
    isAspirant,
    isDataRetention,
    isCanceled,
    canAccessFeatures,
    refreshSubscription
  } = useSubscription();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

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
  const [documents, setDocuments] = useState<
    Array<{
      id: string;
      name: string;
      size: string;
      type: string;
      updated: string;
      url?: string; // Supabase Storage URL
    }>
  >([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
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
    fullName: "Pastor Michael Adams",
    businessName: "Grace Wedding Ceremonies",
    headshot: "",
    city: "Garden City",
    state: "CA",
    yearsExperience: 5,
    rating: 4.9,
    totalReviews: 127,
    phone: "(555) 987-6543",
    email: "pastor.michael@ordainedpro.com",
    website: "https://pastoradams.com",
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
  const [showPreview, setShowPreview] = useState(false);
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

  // Transform couples data to ceremonies format
  useEffect(() => {
    if (couples && couples.length > 0) {
      const transformedCeremonies: Ceremony[] = couples.map((couple) => {
        const getInitials = (name: string) =>
          name
            ? name.split(" ").map((n: string) => n[0]).join("")
            : "";

        const weddingDate = couple.weddingDetails?.weddingDate
          ? new Date(couple.weddingDetails.weddingDate).toLocaleDateString(
              "en-US",
              { year: "numeric", month: "long", day: "numeric" }
            )
          : "TBD";

        const isPastDate = couple.weddingDetails?.weddingDate
          ? new Date(couple.weddingDetails.weddingDate) < new Date()
          : false;

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

  // ✅ Load documents from Supabase Storage
  useEffect(() => {
    const loadDocumentsFromSupabase = async () => {
      if (!user?.id) return;

      try {
        // List files in the user's documents folder
        const { data: files, error } = await supabase.storage
          .from("documents")
          .list(user.id, {
            sortBy: { column: "created_at", order: "desc" },
          });

        if (error) {
          // If bucket doesn't exist or no files, show empty state
          console.log("📁 No documents found or bucket not ready:", error.message);
          setDocuments([]);
          return;
        }

        if (files && files.length > 0) {
          const loadedDocs = files
            .filter(file => file.name !== ".emptyFolderPlaceholder") // Filter out placeholder
            .map((file) => {
              const { data } = supabase.storage
                .from("documents")
                .getPublicUrl(`${user.id}/${file.name}`);

              const fileType = file.name.toLowerCase().includes(".pdf")
                ? "PDF"
                : file.name.toLowerCase().includes(".doc")
                ? "DOC"
                : "FILE";

              // Calculate time ago
              const createdAt = new Date(file.created_at || Date.now());
              const now = new Date();
              const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
              let timeAgo = "Just now";
              if (diffDays === 1) timeAgo = "1 day ago";
              else if (diffDays > 1 && diffDays < 7) timeAgo = `${diffDays} days ago`;
              else if (diffDays >= 7 && diffDays < 14) timeAgo = "1 week ago";
              else if (diffDays >= 14 && diffDays < 30) timeAgo = `${Math.floor(diffDays / 7)} weeks ago`;
              else if (diffDays >= 30) timeAgo = `${Math.floor(diffDays / 30)} month(s) ago`;

              return {
                id: file.id || file.name,
                name: file.name,
                size: file.metadata?.size
                  ? `${(file.metadata.size / 1024).toFixed(0)} KB`
                  : "Unknown",
                type: fileType,
                updated: timeAgo,
                url: data.publicUrl,
              };
            });

          console.log("✅ Loaded documents from Supabase:", loadedDocs);
          setDocuments(loadedDocs);
        } else {
          setDocuments([]);
        }
      } catch (err) {
        console.error("❌ Error loading documents:", err);
        setDocuments([]);
      }
    };

    loadDocumentsFromSupabase();
  }, [user?.id]);
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

  const handleCeremonyClick = (ceremonyId: string) => {
    onSelectCouple(ceremonyId);
    onOpenChange(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!user?.id) {
      alert("⚠️ Please sign in to upload documents.");
      return;
    }

    setUploadingDocument(true);

    try {
      const uploadedDocs: Array<{
        id: string;
        name: string;
        size: string;
        type: string;
        updated: string;
        url: string;
      }> = [];

      for (const file of Array.from(files)) {
        console.log("📤 Uploading document:", file.name, "Size:", file.size);

        // Validate file size (50MB max for documents)
        if (file.size > 52428800) {
          alert(`❌ "${file.name}" is over 50MB. Please use a smaller file.`);
          continue;
        }

        const filePath = `${user.id}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.error(`❌ Upload error for ${file.name}:`, uploadError);
          // If bucket doesn't exist, try to create it first
          if (uploadError.message?.includes("not found")) {
            alert(`❌ Documents storage not configured. Please contact support.`);
          }
          continue;
        }

        const { data } = supabase.storage.from("documents").getPublicUrl(filePath);

        const fileType = file.name.toLowerCase().includes(".pdf")
          ? "PDF"
          : file.name.toLowerCase().includes(".doc")
          ? "DOC"
          : "FILE";

        uploadedDocs.push({
          id: Date.now().toString() + Math.random(),
          name: file.name,
          size: `${(file.size / 1024).toFixed(0)} KB`,
          type: fileType,
          updated: "Just now",
          url: data.publicUrl,
        });

        console.log(`✅ Uploaded document: ${file.name}`);
      }

      if (uploadedDocs.length > 0) {
        setDocuments((prev) => [...uploadedDocs, ...prev]);
        alert(`✅ ${uploadedDocs.length} document(s) uploaded and saved!`);
      }
    } catch (err: any) {
      console.error("❌ Document upload error:", err);
      const errorMsg = err?.message || "Unknown error";
      alert(`❌ Failed to upload document(s).\n\nError: ${errorMsg}`);
    } finally {
      setUploadingDocument(false);
    }
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

      alert("✅ Profile saved successfully!");
      console.log("✅ Supabase response:", data);
    } catch (err) {
      console.error("❌ Error saving profile:", err);
      alert("❌ Failed to save profile. Please try again.");
    }
  };

  // ✅ Helper function to auto-save profile to Supabase (silent mode)
  const saveProfileToSupabase = async (
    profileToSave: OfficiantProfile,
    silent: boolean = true
  ): Promise<boolean> => {
    try {
      if (!user?.id) {
        if (!silent) alert("⚠️ Please sign in before saving your profile.");
        return false;
      }

      const profileData = {
        user_id: user.id,
        full_name: profileToSave.fullName,
        business_name: profileToSave.businessName || null,
        city: profileToSave.city || null,
        state: profileToSave.state || null,
        phone: profileToSave.phone || null,
        email: profileToSave.email,
        website: profileToSave.website || null,
        bio: profileToSave.bio || null,
        headshot_url: profileToSave.headshot || null,
        years_experience: profileToSave.yearsExperience || 0,
        price_min: profileToSave.priceRange.min || 0,
        price_max: profileToSave.priceRange.max || 0,
        social_facebook: profileToSave.socialMedia.facebook || null,
        social_instagram: profileToSave.socialMedia.instagram || null,
        social_linkedin: profileToSave.socialMedia.linkedin || null,
        social_youtube: profileToSave.socialMedia.youtube || null,
        photo_gallery: profileToSave.photoGallery || [],
        video_url: profileToSave.videoUrl || null,
        updated_at: new Date().toISOString(),
      };

      console.log("📝 Auto-saving profile to Supabase:", profileData);

      const { data, error } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "user_id" })
        .select()
        .single();

      if (error) throw error;

      if (!silent) alert("✅ Profile saved successfully!");
      console.log("✅ Profile auto-saved to Supabase:", data);
      return true;
    } catch (err) {
      console.error("❌ Error auto-saving profile:", err);
      if (!silent) alert("❌ Failed to save profile. Please try again.");
      return false;
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

      // Update local state
      const updatedProfile = { ...profile, headshot: publicUrl };
      setProfile(updatedProfile);

      // ✅ Auto-save to Supabase immediately
      const saved = await saveProfileToSupabase(updatedProfile);
      if (saved) {
        alert("✅ Headshot uploaded and saved to your profile!");
      } else {
        alert("✅ Headshot uploaded! Note: Auto-save failed. Click 'Save Profile' to save permanently.");
      }
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

      // Update local state with new gallery photos
      const updatedProfile = {
        ...profile,
        photoGallery: [...profile.photoGallery, ...urls],
      };
      setProfile(updatedProfile);

      // ✅ Auto-save to Supabase immediately
      const saved = await saveProfileToSupabase(updatedProfile);
      if (saved) {
        alert(`✅ ${urls.length} gallery photo(s) uploaded and saved to your profile!`);
      } else {
        alert(`✅ ${urls.length} gallery photo(s) uploaded! Note: Auto-save failed. Click 'Save Profile' to save permanently.`);
      }
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

      // Update local state
      const updatedProfile = { ...profile, videoUrl: data.publicUrl };
      setProfile(updatedProfile);

      // ✅ Auto-save to Supabase immediately
      const saved = await saveProfileToSupabase(updatedProfile);
      if (saved) {
        alert("✅ Video uploaded and saved to your profile!");
      } else {
        alert("✅ Video uploaded! Note: Auto-save failed. Click 'Save Profile' to save permanently.");
      }
      console.log("✅ Video URL:", data.publicUrl);
    } catch (err: any) {
      console.error("❌ Video upload error:", err);
      const errorMsg = err?.message || err?.error || "Unknown error";
      alert(`❌ Failed to upload video.\n\nError: ${errorMsg}\n\nPlease check:\n- Supabase Storage is enabled\n- Storage buckets exist\n- Storage policies allow uploads`);
    }
  };

  const removeGalleryPhoto = async (index: number) => {
    const updatedProfile = {
      ...profile,
      photoGallery: profile.photoGallery.filter((_, i) => i !== index),
    };
    setProfile(updatedProfile);

    // ✅ Auto-save to Supabase immediately
    const saved = await saveProfileToSupabase(updatedProfile);
    if (saved) {
      console.log("✅ Gallery photo removed and profile updated in database");
    } else {
      console.warn("⚠️ Gallery photo removed locally but auto-save failed");
    }
  };

  // ✅ Remove video with auto-save
  const removeVideo = async () => {
    const updatedProfile = { ...profile, videoUrl: "" };
    setProfile(updatedProfile);

    // ✅ Auto-save to Supabase immediately
    const saved = await saveProfileToSupabase(updatedProfile);
    if (saved) {
      console.log("✅ Video removed and profile updated in database");
    } else {
      console.warn("⚠️ Video removed locally but auto-save failed");
    }
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
                <p className="text-xs text-gray-500">Officiant Dashboard</p>
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
                <p className="text-blue-700 text-xs mt-1">
                  Contact support for assistance
                </p>
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
                    Welcome Back
                    {(() => {
                      // Priority: profile.fullName > user.user_metadata.full_name > first part of email
                      const firstName = profile.fullName
                        ? profile.fullName.split(" ")[0]
                        : user?.user_metadata?.full_name
                          ? user.user_metadata.full_name.split(" ")[0]
                          : user?.email
                            ? user.email.split("@")[0]
                            : "";
                      return firstName ? `, ${firstName}` : "";
                    })()}
                    !
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
                      alt={user?.user_metadata?.full_name || "User"}
                    />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {user?.user_metadata?.full_name
                        ? user.user_metadata.full_name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {profile.fullName ||
                        user?.user_metadata?.full_name ||
                        user?.email ||
                        "Loading..."}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profile.businessName || user?.user_metadata?.role || "Officiant"}
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
                          {selectedDate
                            ? selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                            : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                          }
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          className="rounded-md border"
                          modifiers={{
                            hasCeremony: ceremonies
                              .filter(c => c.rawDate)
                              .map(c => new Date(c.rawDate))
                          }}
                          modifiersClassNames={{
                            hasCeremony: "bg-blue-100 text-blue-900 font-bold"
                          }}
                        />
                      </CardContent>
                    </Card>

                    {/* Selected Date Ceremony Details */}
                    {selectedDate && (() => {
                      const selectedDateStr = selectedDate.toISOString().split('T')[0];
                      const selectedCeremony = ceremonies.find(c => c.rawDate === selectedDateStr);

                      if (selectedCeremony) {
                        return (
                          <Card className="mt-6 border-blue-200 bg-blue-50">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-blue-900 flex items-center">
                                <Heart className="w-5 h-5 mr-2 text-pink-500" />
                                Ceremony on {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-start space-x-4">
                                <div className="flex -space-x-2">
                                  <Avatar className="border-2 border-white w-12 h-12">
                                    <AvatarFallback className={selectedCeremony.couple1Color}>
                                      {selectedCeremony.couple1Initial}
                                    </AvatarFallback>
                                  </Avatar>
                                  <Avatar className="border-2 border-white w-12 h-12">
                                    <AvatarFallback className={selectedCeremony.couple2Color}>
                                      {selectedCeremony.couple2Initial}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-bold text-lg text-gray-900">
                                    {selectedCeremony.couple1Name} & {selectedCeremony.couple2Name}
                                  </h3>
                                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                    <div className="flex items-center text-gray-600">
                                      <Clock className="w-4 h-4 mr-2" />
                                      {selectedCeremony.time}
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                      <MapPin className="w-4 h-4 mr-2" />
                                      {selectedCeremony.location}
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                      <Mail className="w-4 h-4 mr-2" />
                                      {selectedCeremony.email}
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                      <Phone className="w-4 h-4 mr-2" />
                                      {selectedCeremony.phone}
                                    </div>
                                  </div>
                                  <Button
                                    className="mt-4 bg-blue-500 hover:bg-blue-600"
                                    onClick={() => handleCeremonyClick(selectedCeremony.id)}
                                  >
                                    Open Ceremony Details
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Sidebar - All Ceremonies List */}
                  <div className="space-y-6">
                    {/* Upcoming Ceremonies */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center">
                          <CalendarIcon className="w-5 h-5 mr-2 text-green-600" />
                          Upcoming Ceremonies
                        </CardTitle>
                        <CardDescription>Next 30 days</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 max-h-64 overflow-y-auto">
                        {upcomingCeremonies.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No upcoming ceremonies</p>
                        ) : (
                          upcomingCeremonies.map((ceremony) => (
                            <div
                              key={ceremony.id}
                              className="p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors border border-green-200"
                              onClick={() => handleCeremonyClick(ceremony.id)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  {ceremony.rawDate ? getDaysUntilCeremony(ceremony.rawDate) : "TBD"}
                                </Badge>
                                <span className="text-xs text-gray-500">{ceremony.time}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="flex -space-x-1">
                                  <Avatar className="border-2 border-white w-6 h-6">
                                    <AvatarFallback className={`${ceremony.couple1Color} text-xs`}>
                                      {ceremony.couple1Initial}
                                    </AvatarFallback>
                                  </Avatar>
                                  <Avatar className="border-2 border-white w-6 h-6">
                                    <AvatarFallback className={`${ceremony.couple2Color} text-xs`}>
                                      {ceremony.couple2Initial}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {(ceremony.couple1Name || "").split(" ")[0]} & {(ceremony.couple2Name || "").split(" ")[0]}
                                </p>
                              </div>
                              <p className="text-xs text-gray-600 flex items-center mt-1 truncate">
                                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                {ceremony.location}
                              </p>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    {/* All My Couples */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center">
                          <Heart className="w-5 h-5 mr-2 text-pink-500" />
                          All My Couples
                        </CardTitle>
                        <CardDescription>{ceremonies.length} total ceremonies</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                        {ceremonies.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No ceremonies yet</p>
                        ) : (
                          ceremonies.map((ceremony) => (
                            <div
                              key={ceremony.id}
                              className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                                ceremony.status === "Active"
                                  ? "bg-white hover:bg-gray-50 border-gray-200"
                                  : "bg-gray-50 hover:bg-gray-100 border-gray-200 opacity-75"
                              }`}
                              onClick={() => handleCeremonyClick(ceremony.id)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div className="flex -space-x-1">
                                    <Avatar className="border-2 border-white w-8 h-8">
                                      <AvatarFallback className={`${ceremony.couple1Color} text-xs`}>
                                        {ceremony.couple1Initial}
                                      </AvatarFallback>
                                    </Avatar>
                                    <Avatar className="border-2 border-white w-8 h-8">
                                      <AvatarFallback className={`${ceremony.couple2Color} text-xs`}>
                                        {ceremony.couple2Initial}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {(ceremony.couple1Name || "").split(" ")[0]} & {(ceremony.couple2Name || "").split(" ")[0]}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {ceremony.couple1Name} & {ceremony.couple2Name}
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  className={ceremony.status === "Active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-600"
                                  }
                                >
                                  {ceremony.status}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-xs text-gray-600 ml-10">
                                <div className="flex items-center">
                                  <CalendarIcon className="w-3 h-3 mr-1" />
                                  {ceremony.date} at {ceremony.time}
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {ceremony.location}
                                </div>
                                <div className="flex items-center">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {ceremony.email}
                                </div>
                                <div className="flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {ceremony.phone}
                                </div>
                              </div>
                            </div>
                          ))
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
                                  {profile.fullName
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              )}
                            </Avatar>
                          </div>
                        </div>

                        {/* Name & Location */}
                        <div className="text-center">
                          <h3 className="font-bold text-lg text-gray-900">
                            {profile.fullName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {profile.city}, {profile.state}
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
                              onClick={removeVideo}
                              className="w-full mt-3"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove Video
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Save and Preview Buttons */}
                    <div className="flex justify-end space-x-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowPreview(true)}
                        className="border-purple-500 text-purple-600 hover:bg-purple-50"
                      >
                        <User className="w-4 h-4 mr-2" />
                        Preview Public Profile
                      </Button>
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
                  Manage templates, contracts, and ceremony scripts
                </p>

                {/* Upload Document Button */}
                <div className="flex justify-end mb-6">
                  <label htmlFor="file-upload">
                    <Button
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      asChild
                      disabled={uploadingDocument}
                    >
                      <span>
                        {uploadingDocument ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Document
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt"
                    disabled={uploadingDocument}
                  />
                </div>

                {/* Documents Grid */}
                {documents.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg mb-6">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="font-medium text-gray-900 mb-1">No documents yet</p>
                    <p className="text-sm text-gray-500">
                      Upload your first document using the button above
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    {documents.map((doc) => (
                      <Card key={doc.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  doc.type === "PDF"
                                    ? "bg-blue-100"
                                    : doc.type === "DOC"
                                    ? "bg-green-100"
                                    : "bg-purple-100"
                                }`}
                              >
                                <FileText
                                  className={`w-5 h-5 ${
                                    doc.type === "PDF"
                                      ? "text-blue-600"
                                      : doc.type === "DOC"
                                      ? "text-green-600"
                                      : "text-purple-600"
                                  }`}
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">
                                  {doc.name}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {doc.type} • {doc.size}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Updated {doc.updated}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (doc.url) {
                                  window.open(doc.url, "_blank");
                                } else {
                                  alert("Document URL not available");
                                }
                              }}
                              title="Download document"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Upload Area */}
                <Card className="border-2 border-dashed border-gray-300">
                  <CardContent className="pt-6">
                    <label
                      htmlFor="file-upload-drop"
                      className="cursor-pointer"
                    >
                      <div className="text-center py-12">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="font-medium text-gray-900 mb-1">
                          Upload New Document
                        </p>
                        <p className="text-sm text-gray-500">
                          Click to browse or drag and drop
                        </p>
                      </div>
                    </label>
                    <input
                      id="file-upload-drop"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.txt"
                    />
                  </CardContent>
                </Card>
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
                          <Button
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                            onClick={() => setShowUpgradeDialog(true)}
                          >
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

                      {/* Subscription Status Banners */}
                      {isCanceled && subscription?.daysRemaining !== undefined && subscription.daysRemaining > 0 && (
                        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-yellow-800">Subscription Canceled</h4>
                              <p className="text-yellow-700 text-sm mt-1">
                                Your subscription has been canceled. You have <strong>{subscription.daysRemaining} days</strong> of access remaining.
                              </p>
                              {subscription.dataDeletionScheduledAt && (
                                <p className="text-yellow-600 text-sm mt-1">
                                  Data will be deleted on: <strong>{new Date(subscription.dataDeletionScheduledAt).toLocaleDateString()}</strong>
                                </p>
                              )}
                              <Button
                                className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white"
                                size="sm"
                                onClick={() => setShowUpgradeDialog(true)}
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Reactivate Subscription
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {isDataRetention && (
                        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <Shield className="w-6 h-6 text-blue-600 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-blue-800">Data Retention Plan Active</h4>
                              <p className="text-blue-700 text-sm mt-1">
                                Your couple/customer data is being preserved for <strong>$1.00/month</strong>.
                              </p>
                              <p className="text-blue-600 text-sm mt-1">
                                You can upgrade to a full subscription anytime to regain full access.
                              </p>
                              <Button
                                className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                                size="sm"
                                onClick={() => setShowUpgradeDialog(true)}
                              >
                                <Crown className="w-4 h-4 mr-2" />
                                Upgrade to Full Plan
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Subscription Management Actions */}
                      {(isProfessional || isAspirant) && !isCanceled && !isDataRetention && (
                        <div className="mt-6 pt-6 border-t">
                          <h3 className="font-semibold text-gray-900 mb-3">
                            Manage Subscription
                          </h3>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              variant="outline"
                              className="border-blue-500 text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                alert("Payment method update coming soon via Square!");
                              }}
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Update Payment Method
                            </Button>
                            <Button
                              variant="outline"
                              className="border-red-500 text-red-700 hover:bg-red-50"
                              onClick={() => setShowCancelDialog(true)}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel Subscription
                            </Button>
                          </div>
                          {subscription?.billingCycleEnd && (
                            <p className="text-sm text-gray-500 mt-3">
                              Your subscription will renew on{" "}
                              <strong>{new Date(subscription.billingCycleEnd).toLocaleDateString()}</strong> for{" "}
                              <strong>${subscription.priceCents ? (subscription.priceCents / 100).toFixed(2) : isProfessional ? "29.00" : "14.95"}/month</strong>
                            </p>
                          )}
                          {!subscription?.billingCycleEnd && (
                            <p className="text-sm text-gray-500 mt-3">
                              Your subscription renews monthly at{" "}
                              <strong>${isProfessional ? "29.00" : "14.95"}/month</strong>
                            </p>
                          )}
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
                            <Button
                              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                              onClick={() => setShowUpgradeDialog(true)}
                            >
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

        {/* Profile Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Public Profile Preview
              </DialogTitle>
              <DialogDescription>
                This is how your profile will appear to couples searching for
                officiants
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Profile Card Preview - matches OfficiantPublicProfile styling */}
              <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-6 rounded-lg">
                <Card className="hover:shadow-xl transition-all border-purple-100 max-w-md mx-auto">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-4">
                      <Avatar className="w-24 h-24 mb-3" key={profile.headshot || 'no-headshot'}>
                        {profile.headshot ? (
                          <AvatarImage src={profile.headshot} key={profile.headshot} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-2xl">
                            {profile.fullName
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <h3 className="font-bold text-lg text-gray-900 text-center">
                        {profile.fullName}
                      </h3>
                      <div className="flex items-center text-gray-600 text-sm mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {profile.city}, {profile.state}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center justify-center space-x-2 mb-3">
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
                        ({profile.totalReviews})
                      </span>
                    </div>

                    {/* Experience Badge */}
                    <div className="flex justify-center mb-3">
                      <Badge className="bg-purple-100 text-purple-800">
                        <Star className="w-3 h-3 mr-1" />
                        {profile.yearsExperience}{" "}
                        {profile.yearsExperience === 1 ? "Year" : "Years"}
                      </Badge>
                    </div>

                    {/* Price Range */}
                    <div className="text-center py-2 bg-green-50 rounded-lg mb-4">
                      <p className="text-sm text-gray-600">Price Range</p>
                      <p className="font-bold text-green-700">
                        ${profile.priceRange.min} - ${profile.priceRange.max}
                      </p>
                    </div>

                    {/* Bio Preview */}
                    <p className="text-sm text-gray-600 text-center line-clamp-3 mb-4">
                      {profile.bio ||
                        "Professional wedding officiant ready to make your ceremony special."}
                    </p>

                    {/* View Profile Button */}
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                      View Full Profile
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Preview */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-lg">Full Profile Details</h3>

                {/* About Section */}
                {profile.bio && (
                  <div>
                    <h4 className="font-semibold mb-2">About</h4>
                    <p className="text-gray-700 leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>
                )}

                {/* Contact Information */}
                <div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {profile.phone && (
                      <div className="flex items-center text-gray-700">
                        <Phone className="w-4 h-4 mr-2" />
                        {profile.phone}
                      </div>
                    )}
                    {profile.email && (
                      <div className="flex items-center text-gray-700">
                        <Mail className="w-4 h-4 mr-2" />
                        {profile.email}
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center text-gray-700">
                        <Globe className="w-4 h-4 mr-2" />
                        {profile.website}
                      </div>
                    )}
                  </div>

                  {/* Social Media */}
                  {(profile.socialMedia.facebook ||
                    profile.socialMedia.instagram ||
                    profile.socialMedia.linkedin ||
                    profile.socialMedia.youtube) && (
                    <div className="flex gap-3 mt-3">
                      {profile.socialMedia.facebook && (
                        <div className="text-gray-600">
                          <Facebook className="w-5 h-5" />
                        </div>
                      )}
                      {profile.socialMedia.instagram && (
                        <div className="text-gray-600">
                          <Instagram className="w-5 h-5" />
                        </div>
                      )}
                      {profile.socialMedia.linkedin && (
                        <div className="text-gray-600">
                          <Linkedin className="w-5 h-5" />
                        </div>
                      )}
                      {profile.socialMedia.youtube && (
                        <div className="text-gray-600">
                          <Youtube className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Media Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {profile.photoGallery.length}
                    </p>
                    <p className="text-sm text-gray-500">Photos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {profile.videoUrl ? "1" : "0"}
                    </p>
                    <p className="text-sm text-gray-500">Video</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {profile.totalReviews}
                    </p>
                    <p className="text-sm text-gray-500">Reviews</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                  className="flex-1"
                >
                  Close Preview
                </Button>
                <Button
                  onClick={() => {
                    setShowPreview(false);
                    alert(
                      "Profile saved successfully! Your profile is now visible to couples searching for officiants."
                    );
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save & Publish Profile
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancellation Dialog */}
        <CancelSubscriptionDialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          userId={user?.id || ""}
          onCanceled={() => {
            refreshSubscription();
          }}
        />

        {/* Upgrade Subscription Dialog */}
        <UpgradeSubscriptionDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          userId={user?.id || ""}
          userEmail={profile.email || user?.email || ""}
          userFullName={profile.fullName || user?.user_metadata?.full_name || ""}
          onUpgraded={() => {
            refreshSubscription();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
