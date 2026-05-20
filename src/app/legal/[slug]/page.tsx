import Link from "next/link"
import { getLegalPolicy, LEGAL_POLICY_LINKS } from "@/lib/legal-policies"

export default async function LegalPolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const policy = getLegalPolicy(slug)

  if (!policy) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-lg border bg-white p-8">
          <h1 className="text-2xl font-bold">Policy not found</h1>
          <Link className="mt-4 inline-block text-blue-600 hover:underline" href="/legal/terms-of-service">
            View Terms of Service
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[260px_1fr]">
        <aside className="rounded-lg border bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-slate-900">OrdainedPro Policies</p>
          <nav className="space-y-2">
            {LEGAL_POLICY_LINKS.map((item) => (
              <Link key={item.slug} className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700" href={item.href}>
                {item.title}
              </Link>
            ))}
          </nav>
        </aside>
        <article className="rounded-lg border bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-blue-700">Working draft - attorney review recommended</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{policy.title}</h1>
          <p className="mt-2 text-sm text-slate-500">
            Version {policy.version} | Effective {policy.effectiveDate}
          </p>
          <div className="mt-8 whitespace-pre-line text-base leading-7 text-slate-700">{policy.body}</div>
        </article>
      </div>
    </main>
  )
}
