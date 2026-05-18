"use client"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function PortalButton() {
    const router = useRouter()

    const handleClick = async () => {
        const { data } = await supabase.auth.getSession()
        if (data?.session) {
            router.push("/officiant-portal")
        } else {
            router.push(`/auth?next=/officiant-portal`)
        }
    }

    return (
        <button onClick={handleClick} className="btn">
            Officiant Portal
        </button>
    )
}
