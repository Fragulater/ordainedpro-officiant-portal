"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const oathText =
  "With a solemn heart and mindful spirit, I pledge to serve with integrity, compassion, and humility; to honor the sacred role entrusted to me; to respect the diversity of traditions, beliefs, and values of those I serve; and to uphold the laws and responsibilities required of me as an officiant.";

function readParam(searchParams: URLSearchParams, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value) return value;
  }
  return fallback;
}

function formatDate(value: string) {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Ordination date needed";
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function makeCertificateId(name: string, date: string) {
  const compactName = name.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase() || "MOL";
  const compactDate = date.replace(/[^0-9]/g, "") || Date.now().toString().slice(-8);
  return `MOL-${compactName}-${compactDate}`;
}

export default function OrdinationCertificateClient() {
  const searchParams = useSearchParams();
  const initialDate = readParam(searchParams, ["date", "ordinationDate", "ordination_date"], "");
  const initialState = readParam(searchParams, ["state"], "Arizona");
  const initialId = readParam(searchParams, ["id", "certificateId", "certificate_id"], "");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState(initialState);
  const [ordinationDate, setOrdinationDate] = useState(
    initialDate || new Date().toISOString().slice(0, 10)
  );
  const [oathPledged, setOathPledged] = useState(false);
  const [certificateId, setCertificateId] = useState(initialId);
  const [showOathError, setShowOathError] = useState(false);

  const displayName = fullName.trim() || "Full legal name needed";
  const displayDate = ordinationDate || new Date().toISOString().slice(0, 10);
  const displayedCertificateId = certificateId || makeCertificateId(displayName, displayDate);
  const formattedDate = formatDate(displayDate);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!oathPledged) {
      setShowOathError(true);
      return;
    }

    const finalCertificateId = certificateId || makeCertificateId(displayName, displayDate);
    setShowOathError(false);
    setCertificateId(finalCertificateId);

    const params = new URLSearchParams();
    params.set("name", displayName);
    params.set("date", displayDate);
    params.set("state", state || "Arizona");
    params.set("id", finalCertificateId);
    if (email) params.set("email", email);
    window.location.href = `/ordination/offer?${params.toString()}`;
  }

  return (
    <main className="ordination-shell">
      <div className="ordination-wrap">
        <header className="page-header">
          <div>
            <p className="eyebrow">Ministries of Love</p>
            <h1>Ordination Certificate</h1>
            <p className="subhead">
              Enter the officiant information, pledge the oath, then generate the certificate.
            </p>
          </div>
        </header>

        <div className="certificate-layout">
          <form className="form-panel" onSubmit={handleSubmit}>
            <div className="panel-title">
              <h2>Officiant Information</h2>
              <p>This information appears on the generated certificate.</p>
            </div>

            <div className="field-stack">
              <label>
                <span>Full legal name</span>
                <input
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Enter officiant full legal name"
                />
              </label>

              <label>
                <span>Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                />
              </label>

              <div className="two-up">
                <label>
                  <span>State</span>
                  <input
                    required
                    value={state}
                    onChange={(event) => setState(event.target.value)}
                    placeholder="Arizona"
                  />
                </label>

                <label>
                  <span>Ordination date</span>
                  <input
                    required
                    type="date"
                    value={ordinationDate}
                    onChange={(event) => setOrdinationDate(event.target.value)}
                  />
                </label>
              </div>
            </div>

            <section className="oath-box">
              <h3>Ordination Oath</h3>
              <p>{oathText}</p>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={oathPledged}
                  onChange={(event) => setOathPledged(event.target.checked)}
                />
                <span>
                  I pledge to the Ordination Oath and affirm that the information above is accurate.
                </span>
              </label>
              {showOathError ? (
                <p className="error">Please pledge to the oath before generating the certificate.</p>
              ) : null}
            </section>

            <button className="button primary wide" type="submit">
              Generate Certificate
            </button>
            <p className="helper">The authorized signature is applied automatically.</p>
          </form>

          <section className="preview-panel" aria-live="polite">
            <article className="certificate-print certificate-card">
                <div className="watermark" aria-hidden="true">PREVIEW</div>
                <img
                  src="/ministries-of-love-logo.svg"
                  alt="Ministries of Love"
                  className="corner-logo"
                />
                <p className="certificate-org">Ministries of Love</p>
                <h2>Certificate of Ordination</h2>
                <p className="certifies">This certifies that</p>
                <p className="recipient">{displayName}</p>
                <p className="credential">
                  has received licensed minister credentials through Ministries of Love on{" "}
                  <strong>{formattedDate}</strong> and is recognized as an Arbiter of Matrimony in{" "}
                  <strong>{state || "Arizona"}</strong>.
                </p>

                <div className="seal">
                  <span>State of<br />Arizona</span>
                </div>

                <div className="certificate-footer">
                  <div>
                    <img
                      src="/daniel_salerno_signature_vector.svg"
                      alt="Daniel Salerno signature"
                      className="signature"
                    />
                    <p>Arbiter of Matrimony</p>
                  </div>
                  <div>
                    <strong>{displayedCertificateId}</strong>
                    <p>Certificate ID</p>
                  </div>
                </div>
              </article>
          </section>
        </div>

        <footer className="return-bar">
          <p>Use this page to update the officiant name, date, state, and oath pledge.</p>
          <Link href="/auth?source=certificate">
            <ArrowLeft size={17} />
            Return to OrdainedPro
          </Link>
        </footer>
      </div>

      <style jsx>{`
        .ordination-shell {
          min-height: 100vh;
          background: #f3f8ff;
          color: #07172f;
          padding: 28px 18px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .ordination-wrap {
          max-width: 1180px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 22px;
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #0a57c2;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        h1,
        h2,
        h3,
        p {
          margin-top: 0;
        }

        h1 {
          margin-bottom: 8px;
          font-size: clamp(32px, 4vw, 46px);
          line-height: 1.05;
          font-weight: 900;
        }

        .subhead {
          margin-bottom: 0;
          max-width: 620px;
          color: #50627c;
          font-size: 16px;
          line-height: 1.55;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 44px;
          border-radius: 8px;
          border: 1px solid transparent;
          padding: 0 16px;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }

        .button.primary {
          background: #155dfc;
          color: #fff;
        }

        .button.primary:hover {
          background: #0f4ed8;
        }

        .button.secondary {
          background: #fff;
          border-color: #bfd5ff;
          color: #0a57c2;
        }

        .button:disabled,
        .button.disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .button.wide {
          width: 100%;
          margin-top: 18px;
        }

        .header-next {
          white-space: nowrap;
        }

        .next-button {
          margin-top: 10px;
        }

        .certificate-layout {
          display: grid;
          grid-template-columns: minmax(340px, 0.85fr) minmax(0, 1.25fr);
          gap: 22px;
          align-items: start;
        }

        .form-panel,
        .preview-panel,
        .return-bar {
          border: 1px solid #d8e8ff;
          border-radius: 10px;
          background: #fff;
          box-shadow: 0 12px 28px rgba(15, 39, 77, 0.08);
        }

        .form-panel {
          padding: 22px;
        }

        .panel-title h2 {
          margin-bottom: 6px;
          font-size: 21px;
          font-weight: 900;
        }

        .panel-title p,
        .helper {
          color: #63738c;
          font-size: 13px;
          line-height: 1.5;
        }

        .field-stack {
          display: grid;
          gap: 15px;
          margin-top: 18px;
        }

        label {
          display: grid;
          gap: 7px;
          color: #263954;
          font-size: 13px;
          font-weight: 800;
        }

        input {
          width: 100%;
          height: 44px;
          box-sizing: border-box;
          border: 1px solid #cfdced;
          border-radius: 8px;
          background: #fff;
          padding: 0 12px;
          color: #07172f;
          font: inherit;
          font-weight: 500;
          outline: none;
        }

        input:focus {
          border-color: #155dfc;
          box-shadow: 0 0 0 3px rgba(21, 93, 252, 0.12);
        }

        .two-up {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .oath-box {
          margin-top: 20px;
          border: 1px solid #cfe0ff;
          border-radius: 10px;
          background: #f6f9ff;
          padding: 16px;
        }

        .oath-box h3 {
          margin-bottom: 8px;
          font-size: 15px;
          font-weight: 900;
        }

        .oath-box p {
          color: #3f5270;
          font-size: 13px;
          line-height: 1.65;
        }

        .checkbox-row {
          display: flex;
          align-items: flex-start;
          grid-template-columns: none;
          gap: 10px;
          margin-top: 14px;
          line-height: 1.45;
        }

        .checkbox-row input {
          width: 17px;
          height: 17px;
          margin-top: 2px;
          padding: 0;
          flex: 0 0 auto;
        }

        .error {
          margin: 10px 0 0;
          color: #dc2626;
          font-weight: 800;
        }

        .helper {
          margin: 12px 0 0;
        }

        .preview-panel {
          padding: 18px;
        }

        .empty-preview {
          min-height: 540px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 2px dashed #cfe0ff;
          border-radius: 10px;
          background: #f7fbff;
          padding: 28px;
          text-align: center;
        }

        .empty-preview img {
          width: 190px;
          max-width: 70%;
          border-radius: 10px;
        }

        .empty-preview h2 {
          margin: 22px 0 8px;
          font-size: 25px;
          font-weight: 900;
        }

        .empty-preview p {
          max-width: 420px;
          color: #65758c;
          line-height: 1.55;
        }

        .certificate-card {
          position: relative;
          overflow: hidden;
          min-height: 590px;
          border: 8px double #bcd5ff;
          border-radius: 10px;
          background: #fff;
          padding: 42px 44px 34px;
          text-align: center;
        }

        .watermark {
          position: absolute;
          inset: 0;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(-24deg);
          color: rgba(21, 93, 252, 0.16);
          font-size: clamp(54px, 9vw, 108px);
          font-weight: 900;
          letter-spacing: 0.12em;
          pointer-events: none;
          user-select: none;
        }

        .corner-logo {
          position: absolute;
          right: 14px;
          bottom: 14px;
          width: 96px;
          height: 66px;
          border-radius: 8px;
          object-fit: contain;
          z-index: 1;
        }

        .certificate-mark {
          width: 62px;
          height: 62px;
          margin: 0 auto;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: #155dfc;
          color: #fff;
          font-size: 30px;
          font-weight: 900;
        }

        .certificate-org {
          margin: 24px 0 0;
          color: #0a57c2;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.28em;
          text-transform: uppercase;
        }

        .certificate-card h2 {
          margin: 16px 0 0;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(34px, 4vw, 52px);
          font-weight: 700;
          line-height: 1.08;
        }

        .certifies {
          margin: 34px 0 0;
          color: #61718a;
          font-size: 17px;
        }

        .recipient {
          margin: 10px auto 0;
          max-width: 620px;
          border-bottom: 1px solid #9aa8bb;
          padding-bottom: 10px;
          font-size: clamp(26px, 3vw, 38px);
          font-weight: 900;
        }

        .credential {
          margin: 28px auto 0;
          max-width: 660px;
          color: #40526d;
          font-size: 17px;
          line-height: 1.7;
        }

        .credential strong {
          color: #07172f;
        }

        .seal {
          width: 98px;
          height: 98px;
          margin: 34px auto 0;
          display: grid;
          place-items: center;
          border: 4px solid #b87a1d;
          border-radius: 999px;
          background: radial-gradient(circle, #ffe9ad 0%, #f6cf76 72%, #d8a33f 100%);
          box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.75), 0 5px 14px rgba(61, 40, 7, 0.14);
        }

        .seal span {
          color: #23190a;
          font-size: 13px;
          font-weight: 900;
          line-height: 1.2;
        }

        .certificate-footer {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 36px;
          max-width: 650px;
          margin: 34px auto 0;
        }

        .certificate-footer > div {
          border-top: 1px solid #9aa8bb;
          padding-top: 12px;
        }

        .signature {
          width: 220px;
          max-width: 100%;
          height: 36px;
          object-fit: contain;
          transform: translateY(-10px);
          margin-bottom: -8px;
        }

        .certificate-footer p {
          margin: 6px 0 0;
          color: #607089;
          font-size: 13px;
        }

        .certificate-footer strong {
          display: block;
          min-height: 36px;
          padding-top: 4px;
          font-size: 14px;
        }

        .return-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 20px;
          padding: 15px 18px;
          color: #63738c;
          font-size: 14px;
        }

        .return-bar p {
          margin: 0;
        }

        .return-bar a {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #0a57c2;
          font-weight: 800;
          text-decoration: none;
          white-space: nowrap;
        }

        @media (max-width: 900px) {
          .page-header,
          .return-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .certificate-layout {
            grid-template-columns: 1fr;
          }

          .actions {
            width: 100%;
          }

          .header-next {
            width: 100%;
          }
        }

        @media (max-width: 560px) {
          .ordination-shell {
            padding: 18px 12px;
          }

          .two-up,
          .certificate-footer {
            grid-template-columns: 1fr;
          }

          .certificate-card {
            padding: 34px 20px 28px;
          }

          .corner-logo {
            width: 74px;
            height: 52px;
            right: 10px;
            bottom: 10px;
          }
        }

        @media print {
          .page-header,
          .form-panel,
          .return-bar {
            display: none;
          }

          .ordination-shell {
            background: #fff;
            padding: 0;
          }

          .ordination-wrap,
          .certificate-layout,
          .preview-panel {
            display: block;
            max-width: none;
            border: 0;
            box-shadow: none;
            padding: 0;
          }

          .certificate-card {
            min-height: auto;
            border-color: #8fb4ef;
            box-shadow: none;
          }
        }
      `}</style>
    </main>
  );
}
