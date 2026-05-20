export type LegalPolicy = {
  slug: string
  title: string
  version: string
  effectiveDate: string
  requiresAcceptance: boolean
  body: string
}

export const LEGAL_EFFECTIVE_DATE = "2026-06-01"
export const LEGAL_VERSION = "1.0-placeholder"

export const LEGAL_POLICIES: LegalPolicy[] = [
  {
    slug: "terms-of-service",
    title: "Terms of Service",
    version: LEGAL_VERSION,
    effectiveDate: LEGAL_EFFECTIVE_DATE,
    requiresAcceptance: true,
    body: "OrdainedPro provides wedding officiant CRM tools, document storage, script creation tools, subscriptions, and a script marketplace. Users must be at least 18, provide accurate account information, follow platform rules, and verify all ceremony and marriage-law requirements for their jurisdiction. OrdainedPro does not provide legal advice. Subscriptions may renew until canceled. Seller marketplace access may require an active Aspirant or Professional subscription. If a subscription ends, marketplace listings may be removed and CRM data may be archived or scheduled for deletion according to the data retention policy.",
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy",
    version: LEGAL_VERSION,
    effectiveDate: LEGAL_EFFECTIVE_DATE,
    requiresAcceptance: true,
    body: "OrdainedPro may collect account details, officiant profile information, couple and ceremony information entered by users, marketplace listing information, purchase records, subscription status, support communications, and technical usage data. This information is used to operate the CRM, marketplace, payments, downloads, support, security, legal compliance, and platform improvements. Users are responsible for having permission to enter couple information. OrdainedPro does not sell couple information as a standalone product.",
  },
  {
    slug: "seller-agreement",
    title: "Seller Agreement",
    version: LEGAL_VERSION,
    effectiveDate: LEGAL_EFFECTIVE_DATE,
    requiresAcceptance: true,
    body: "Sellers must own or have the right to sell any uploaded script. Sellers keep copyright in their original work while granting OrdainedPro rights to host, display, market, sell, distribute, and deliver listed scripts. Buyers receive a license to use, edit, print, and perform purchased scripts, but not to resell or redistribute them as standalone products. To protect marketplace quality, sellers may display up to 10 active scripts in the main marketplace while using their personal store for additional active listings.",
  },
  {
    slug: "buyer-license-agreement",
    title: "Buyer License Agreement",
    version: LEGAL_VERSION,
    effectiveDate: LEGAL_EFFECTIVE_DATE,
    requiresAcceptance: true,
    body: "A script purchase grants a non-exclusive license to download, save, print, edit, customize, and perform the script for wedding ceremony or related personal/professional use. Buyers may personalize scripts for couples and ceremony participants. Buyers may not resell, redistribute, upload, publish, give away, include in bundles, or claim the original purchased script as their own standalone product.",
  },
  {
    slug: "refund-policy",
    title: "Refund Policy",
    version: LEGAL_VERSION,
    effectiveDate: LEGAL_EFFECTIVE_DATE,
    requiresAcceptance: true,
    body: "Because digital scripts may be delivered immediately after purchase, digital download sales are generally final once delivered or accessed. OrdainedPro may approve refunds for duplicate charges, failed delivery, material misrepresentation, verified infringement, legal requirements, or other circumstances OrdainedPro determines appropriate. Subscription and archive plan payments are generally non-refundable once billed unless required by law or approved by OrdainedPro.",
  },
  {
    slug: "ai-generated-content-policy",
    title: "AI-Generated Content Policy",
    version: LEGAL_VERSION,
    effectiveDate: LEGAL_EFFECTIVE_DATE,
    requiresAcceptance: true,
    body: "Users and sellers must review, edit, fact-check, and approve AI-generated or AI-assisted content before saving, using, publishing, selling, or delivering it. Sellers may not upload raw AI output without meaningful human review and originality. AI may not be used to copy, imitate, closely rewrite, or infringe another seller's or third party's work. OrdainedPro may review, reject, remove, hide, or limit low-quality, duplicative, misleading, infringing, or non-original AI-assisted content.",
  },
  {
    slug: "subscription-cancellation-data-retention-policy",
    title: "Subscription Cancellation and Data Retention Policy",
    version: LEGAL_VERSION,
    effectiveDate: LEGAL_EFFECTIVE_DATE,
    requiresAcceptance: true,
    body: "An active subscription is required for full CRM access, public profile features, and marketplace selling. If a subscription ends, active marketplace listings may be removed, hidden, unpublished, or made unavailable for new purchases. CRM data may become inactive and may be scheduled for permanent deletion unless the user chooses an Archive Plan. OrdainedPro should use a grace period before permanent deletion where operationally possible, while preserving records required for business, tax, legal, fraud, chargeback, and backup purposes.",
  },
]

export const LEGAL_POLICY_LINKS = LEGAL_POLICIES.map(({ slug, title }) => ({ slug, title, href: `/legal/${slug}` }))

export function getLegalPolicy(slug: string) {
  return LEGAL_POLICIES.find((policy) => policy.slug === slug)
}
