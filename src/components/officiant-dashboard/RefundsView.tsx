"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/supabase/utils/client";
import { AlertCircle, Check, DollarSign, RefreshCw, RotateCcw, Search } from "lucide-react";

type RefundCouple = {
  id: number;
  bride_name?: string | null;
  groom_name?: string | null;
  bride_email?: string | null;
  groom_email?: string | null;
  venue_name?: string | null;
  wedding_date?: string | null;
  is_active?: boolean | null;
};

type RefundPayment = {
  id: number;
  couple_id: number;
  invoice_number?: string | null;
  amount?: number | string | null;
  status?: string | null;
  payment_method?: string | null;
  due_date?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

type RefundsViewProps = {
  userId?: string;
};

const todayLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const money = (value: number) => `$${Number(value || 0).toFixed(2)}`;

const isRefundPayment = (payment: RefundPayment) =>
  payment.status === "refunded" || String(payment.payment_method || "").toLowerCase() === "refund";

const isPaidPayment = (payment: RefundPayment) => payment.status === "paid" && !isRefundPayment(payment);

const getCoupleName = (couple?: RefundCouple) => {
  const names = [couple?.bride_name, couple?.groom_name].filter(Boolean);
  return names.length ? names.join(" & ") : "Unnamed client";
};

export function RefundsView({ userId }: RefundsViewProps) {
  const [couples, setCouples] = useState<RefundCouple[]>([]);
  const [payments, setPayments] = useState<RefundPayment[]>([]);
  const [selectedCoupleId, setSelectedCoupleId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundDate, setRefundDate] = useState(todayLocal());
  const [refundMethod, setRefundMethod] = useState("Original payment method");
  const [refundNotes, setRefundNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const loadRefundData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const [couplesResult, paymentsResult] = await Promise.all([
        supabase
          .from("couples")
          .select("id, bride_name, groom_name, bride_email, groom_email, venue_name, wedding_date, is_active")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("payments")
          .select("id, couple_id, invoice_number, amount, status, payment_method, due_date, notes, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      if (couplesResult.error) throw couplesResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      setCouples(couplesResult.data || []);
      setPayments(paymentsResult.data || []);
    } catch (error) {
      console.error("Unable to load refund data:", error);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefundData();
  }, [userId]);

  const coupleSummaries = useMemo(() => {
    return couples.map((couple) => {
      const records = payments.filter((payment) => Number(payment.couple_id) === Number(couple.id));
      const paid = records.filter(isPaidPayment).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      const refunded = records.filter(isRefundPayment).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
      return {
        couple,
        paid,
        refunded,
        refundable: Math.max(0, paid - refunded),
      };
    });
  }, [couples, payments]);

  const filteredSummaries = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase();
    if (!needle) return coupleSummaries;

    return coupleSummaries.filter(({ couple }) => {
      return [
        getCoupleName(couple),
        couple.bride_email,
        couple.groom_email,
        couple.venue_name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [coupleSummaries, searchQuery]);

  const selectedSummary = coupleSummaries.find(({ couple }) => String(couple.id) === selectedCoupleId);
  const recentRefunds = payments.filter(isRefundPayment).slice(0, 10);

  const handleSubmitRefund = async () => {
    if (!userId || !selectedCoupleId) return;

    const amount = Number(refundAmount);
    if (!amount || amount <= 0) {
      setStatus("error");
      return;
    }

    setSaving(true);
    setStatus("idle");

    const selectedCouple = couples.find((couple) => String(couple.id) === selectedCoupleId);
    const result = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        couple_id: Number(selectedCoupleId),
        invoice_number: `REF-${Date.now()}`,
        amount,
        status: "paid",
        due_date: refundDate || null,
        payment_method: "refund",
        notes: `Refund - ${getCoupleName(selectedCouple)}${refundMethod ? ` via ${refundMethod}` : ""}${refundNotes ? `: ${refundNotes}` : ""}`,
      })
      .select("id, couple_id, invoice_number, amount, status, payment_method, due_date, notes, created_at")
      .single();

    setSaving(false);

    if (result.error) {
      console.error("Unable to record refund:", result.error);
      setStatus("error");
      return;
    }

    setPayments((current) => [result.data, ...current]);
    setRefundAmount("");
    setRefundNotes("");
    setRefundDate(todayLocal());
    setRefundMethod("Original payment method");
    setStatus("saved");
    window.setTimeout(() => setStatus("idle"), 2400);
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Refunds</h2>
          <p className="mt-1 text-gray-600">
            Record and review refunds across all ceremony clients.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-red-200 text-red-700 hover:bg-red-50"
          onClick={loadRefundData}
          disabled={loading}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="border-red-100 shadow-md">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
            <CardTitle className="flex items-center gap-2 text-red-950">
              <RotateCcw className="h-5 w-5" />
              Record a Refund
            </CardTitle>
            <CardDescription>
              Choose any client in your account and record a refund against that profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div>
              <Label htmlFor="refund-client">Client / ceremony profile</Label>
              <select
                id="refund-client"
                value={selectedCoupleId}
                onChange={(event) => setSelectedCoupleId(event.target.value)}
                className="mt-2 h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option value="">Select a client</option>
                {coupleSummaries.map(({ couple, refundable }) => (
                  <option key={couple.id} value={couple.id}>
                    {getCoupleName(couple)} - refundable tracked balance {money(refundable)}
                  </option>
                ))}
              </select>
            </div>

            {selectedSummary && (
              <div className="grid gap-3 rounded-xl border border-red-100 bg-red-50 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase text-red-700">Paid</p>
                  <p className="text-lg font-bold text-red-950">{money(selectedSummary.paid)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-red-700">Refunded</p>
                  <p className="text-lg font-bold text-red-950">{money(selectedSummary.refunded)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-red-700">Tracked balance</p>
                  <p className="text-lg font-bold text-red-950">{money(selectedSummary.refundable)}</p>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="refund-amount">Refund amount</Label>
                <div className="relative mt-2">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="refund-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={refundAmount}
                    onChange={(event) => setRefundAmount(event.target.value)}
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="refund-date">Refund date</Label>
                <Input
                  id="refund-date"
                  type="date"
                  value={refundDate}
                  onChange={(event) => setRefundDate(event.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="refund-method">Refund method</Label>
              <select
                id="refund-method"
                value={refundMethod}
                onChange={(event) => setRefundMethod(event.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              >
                <option>Original payment method</option>
                <option>Credit Card</option>
                <option>Cash</option>
                <option>Check</option>
                <option>Bank Transfer</option>
                <option>Venmo</option>
                <option>Zelle</option>
                <option>PayPal</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="refund-notes">Notes</Label>
              <Textarea
                id="refund-notes"
                value={refundNotes}
                onChange={(event) => setRefundNotes(event.target.value)}
                placeholder="Reason for the refund, internal notes, or payment processor reference..."
                rows={4}
                className="mt-2"
              />
            </div>

            <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p
                className={`text-sm font-medium transition-opacity ${
                  status === "saved" ? "text-green-700 opacity-100" : status === "error" ? "text-red-700 opacity-100" : "opacity-0"
                }`}
                aria-live="polite"
              >
                {status === "saved" ? "Refund recorded." : status === "error" ? "Unable to record refund." : "Ready"}
              </p>
              <Button
                onClick={handleSubmitRefund}
                disabled={saving || !selectedCoupleId || !refundAmount || Number(refundAmount) <= 0}
                className="bg-red-500 hover:bg-red-600"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {saving ? "Recording..." : "Record Refund"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-blue-100 shadow-md">
            <CardHeader>
              <CardTitle className="text-blue-950">Find a Customer</CardTitle>
              <CardDescription>Search by name, email, or venue.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search customers..."
                  className="pl-10"
                />
              </div>
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {filteredSummaries.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                    No customers found.
                  </div>
                ) : (
                  filteredSummaries.map(({ couple, paid, refunded, refundable }) => (
                    <button
                      key={couple.id}
                      type="button"
                      onClick={() => setSelectedCoupleId(String(couple.id))}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        String(couple.id) === selectedCoupleId
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{getCoupleName(couple)}</p>
                          <p className="text-xs text-gray-500">
                            {[couple.bride_email || couple.groom_email, couple.venue_name].filter(Boolean).join(" - ") || "No email or venue saved"}
                          </p>
                        </div>
                        <Badge className={refundable > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
                          {money(refundable)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Paid {money(paid)} / Refunded {money(refunded)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-100 shadow-md">
            <CardHeader>
              <CardTitle className="text-red-950">Recent Refunds</CardTitle>
              <CardDescription>Latest refund records across your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentRefunds.length === 0 ? (
                <div className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  No refunds recorded yet.
                </div>
              ) : (
                recentRefunds.map((refund) => {
                  const couple = couples.find((item) => Number(item.id) === Number(refund.couple_id));
                  return (
                    <div key={refund.id} className="rounded-lg border border-red-100 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-gray-900">{getCoupleName(couple)}</p>
                        <p className="font-bold text-red-700">-{money(Number(refund.amount || 0))}</p>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">{refund.due_date || refund.created_at?.slice(0, 10) || "No date"} - {refund.notes || "Refund"}</p>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
