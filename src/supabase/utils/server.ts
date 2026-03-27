// import { createServerClient } from "@supabase/ssr"
// import { cookies } from "next/headers"

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// export const createClient = () => {
//   // ✅ Correct — cookies() is synchronous
//   const cookieStore = cookies()

//   return createServerClient(
//     supabaseUrl!,
//     supabaseKey!,
//     {
//       cookies: {
//         getAll() {
//           return cookieStore.getAll()
//         },
//         setAll(cookiesToSet) {
//           try {
//             cookiesToSet.forEach(({ name, value, options }) => {
//               cookieStore.set(name, value, options)
//             })
//           } catch {
//             // ✅ Safe to ignore when called from a server component
//             // Supabase middleware will refresh sessions automatically.
//           }
//         },
//       },
//     }
//   )
// }
// import { createServerClient } from "@supabase/ssr"
// import { cookies } from "next/headers"

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// export const createClient = () => {
//   const cookieStore = cookies()

//   return createServerClient(supabaseUrl, supabaseKey, {
//     cookies: {
//       getAll() {
//         return cookieStore.getAll()
//       },
//       setAll(cookiesToSet) {
//         try {
//           cookiesToSet.forEach(({ name, value, options }) =>
//             cookieStore.set(name, value, options)
//           )
//         } catch {
//           // Safe to ignore for server components
//         }
//       },
//     },
//   })
// }
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const createClient = async () => {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // ignore for server components
        }
      },
    },
  })
}
