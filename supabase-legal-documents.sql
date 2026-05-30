-- OrdainedPro legal policy placeholders and acceptance tracking.
-- Run in Supabase SQL Editor. Replace placeholder body text after attorney review.

CREATE TABLE IF NOT EXISTS public.legal_documents (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  version TEXT NOT NULL,
  effective_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  requires_acceptance BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (slug, version)
);

CREATE TABLE IF NOT EXISTS public.legal_acceptances (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_slug TEXT NOT NULL,
  document_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  context TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.legal_documents TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legal_documents TO service_role;
GRANT SELECT, INSERT ON TABLE public.legal_acceptances TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legal_acceptances TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.legal_documents_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.legal_acceptances_id_seq TO authenticated, service_role;

DROP POLICY IF EXISTS "Anyone can view published legal documents" ON public.legal_documents;
CREATE POLICY "Anyone can view published legal documents"
  ON public.legal_documents FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Users can view own legal acceptances" ON public.legal_acceptances;
CREATE POLICY "Users can view own legal acceptances"
  ON public.legal_acceptances FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own legal acceptances" ON public.legal_acceptances;
CREATE POLICY "Users can insert own legal acceptances"
  ON public.legal_acceptances FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_legal_documents_slug_status
  ON public.legal_documents(slug, status);

CREATE INDEX IF NOT EXISTS idx_legal_acceptances_user_document
  ON public.legal_acceptances(user_id, document_slug, document_version);

INSERT INTO public.legal_documents (slug, title, body, version, effective_date, status, requires_acceptance)
VALUES
  ('terms-of-service', 'Terms of Service', 'Working draft placeholder. OrdainedPro provides CRM, subscription, document, script creation, and marketplace tools. Users must follow platform rules and verify ceremony legal requirements.', '1.0-placeholder', '2026-06-01', 'published', TRUE),
  ('privacy-policy', 'Privacy Policy', 'Working draft placeholder. OrdainedPro collects account, CRM, couple, marketplace, payment, support, and technical information to operate, secure, improve, and support the platform.', '1.0-placeholder', '2026-06-01', 'published', TRUE),
  ('seller-agreement', 'Seller Agreement', 'Working draft placeholder. Sellers must own or have rights to scripts. Sellers keep copyright while granting OrdainedPro marketplace rights and buyers a usage license.', '1.0-placeholder', '2026-06-01', 'published', TRUE),
  ('buyer-license-agreement', 'Buyer License Agreement', 'Working draft placeholder. Buyers may download, save, print, edit, customize, and perform purchased scripts, but may not resell, redistribute, or claim the original script as their own standalone product.', '1.0-placeholder', '2026-06-01', 'published', TRUE),
  ('refund-policy', 'Refund Policy', 'Working draft placeholder. Digital download sales are generally final once delivered or accessed, with exceptions for duplicate charges, failed delivery, material misrepresentation, verified infringement, legal requirements, or OrdainedPro approval.', '1.0-placeholder', '2026-06-01', 'published', TRUE),
  ('ai-generated-content-policy', 'AI-Generated Content Policy', 'Working draft placeholder. AI-assisted content must be reviewed, edited, approved, original, non-infringing, and not used to flood or copy marketplace listings.', '1.0-placeholder', '2026-06-01', 'published', TRUE),
  ('subscription-cancellation-data-retention-policy', 'Subscription Cancellation and Data Retention Policy', 'Working draft placeholder. Canceling may remove active marketplace listings and may cause CRM data to be archived or scheduled for deletion unless an Archive Plan is chosen. Necessary business, tax, legal, fraud, chargeback, and backup records may be retained.', '1.0-placeholder', '2026-06-01', 'published', TRUE),
  ('default-contract-attorney-review-acknowledgment', 'Attorney Review & Legal Acknowledgment', 'By checking this box, I acknowledge and understand that this contract template is provided as a general starting point only and is not legal advice. I understand that wedding officiant business requirements, marriage laws, cancellation and refund rules, liability protections, electronic signature rules, consumer protection laws, and contract requirements may vary by state, county, city, venue, and individual business circumstance. I understand that this template may not comply with all applicable laws and may not fully protect my business, income, deposits, services, intellectual property, or legal interests. I agree that before using, sending, or relying on this contract, I am responsible for having it reviewed, revised, and approved by a qualified attorney licensed in the state where I conduct business. I understand that if I choose to use this contract without attorney review, I do so at my own risk.', 'ordainedpro-default-contract-v1', '2026-06-01', 'published', TRUE),
  ('uploaded-contract-attorney-review-acknowledgment', 'Uploaded Contract Attorney Review Acknowledgment', 'By checking this box, I acknowledge and confirm that I have chosen to upload and/or use my own contract instead of the default contract template provided by this platform. I understand that I am solely responsible for the content, accuracy, legality, enforceability, and suitability of my own contract. I further acknowledge that this document has been reviewed by a qualified attorney, or that I have knowingly chosen to use it without further legal review at my own risk. I understand that different states, counties, cities, venues, and business situations may have different legal requirements, and I agree that this platform is not responsible for whether my uploaded contract protects my business, complies with applicable law, or is enforceable in any jurisdiction.', 'uploaded-contract-v1', '2026-06-01', 'published', TRUE)
ON CONFLICT (slug, version) DO UPDATE
SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  effective_date = EXCLUDED.effective_date,
  status = EXCLUDED.status,
  requires_acceptance = EXCLUDED.requires_acceptance,
  updated_at = NOW();
