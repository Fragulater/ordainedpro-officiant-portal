"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, X, DollarSign, Shield } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onCanceled: () => void;
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  userId,
  onCanceled,
}: CancelSubscriptionDialogProps) {
  const { subscription, refreshSubscription } = useSubscription();
  const [acknowledged, setAcknowledged] = useState(false);
  const [keepDataRetention, setKeepDataRetention] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!acknowledged) {
      setError("Please acknowledge that you understand the data deletion policy.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/subscriptions/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          keepDataRetention,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel subscription");
      }

      // Refresh subscription data
      await refreshSubscription();

      // Close dialog and notify parent
      onOpenChange(false);
      onCanceled();

      // Show appropriate message
      if (keepDataRetention) {
        alert(
          "Your subscription has been changed to the Data Retention plan ($1.00/month).\n\n" +
          "Your couple/customer data will be preserved as long as this plan remains active."
        );
      } else {
        alert(
          `Your subscription has been canceled.\n\n` +
          `You will retain access until ${new Date(data.accessEndsAt).toLocaleDateString()}.\n\n` +
          `Your data will be deleted on ${new Date(data.dataDeletionAt).toLocaleDateString()} (30 days after billing stops).`
        );
      }
    } catch (err: any) {
      console.error("Cancellation error:", err);
      setError(err.message || "Failed to cancel subscription. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setAcknowledged(false);
    setKeepDataRetention(false);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="w-6 h-6 mr-2" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription>
            Please review the following information carefully before canceling.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Warning Message */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <h3 className="font-bold text-red-700 mb-2 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Important Warning
            </h3>
            <p className="text-red-700 text-sm leading-relaxed">
              <span className="font-bold text-red-800">
                If you cancel your subscription, you will lose access to your
                couple/customer profiles.
              </span>
            </p>
            <p className="text-red-600 text-sm mt-2 leading-relaxed">
              All couple data associated with your account will be removed
              <span className="font-bold"> 30 days after billing/payments stop</span>.
              This includes:
            </p>
            <ul className="text-red-600 text-sm mt-2 list-disc list-inside space-y-1">
              <li>Ceremony details</li>
              <li>Questionnaires</li>
              <li>Notes</li>
              <li>Saved couple information</li>
              <li>Scripts and documents</li>
            </ul>
          </div>

          {/* Data Retention Option */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="data-retention"
                checked={keepDataRetention}
                onCheckedChange={(checked) => setKeepDataRetention(checked as boolean)}
                className="mt-1"
              />
              <div>
                <Label
                  htmlFor="data-retention"
                  className="font-semibold text-blue-800 cursor-pointer flex items-center"
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Keep my customer data stored for $1.00 per month
                </Label>
                <p className="text-blue-700 text-sm mt-1">
                  Your couple/customer profiles will remain stored. You can
                  upgrade back to a full subscription at any time.
                </p>
              </div>
            </div>
          </div>

          {/* Acknowledgment Checkbox */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="acknowledge"
                checked={acknowledged}
                onCheckedChange={(checked) => {
                  setAcknowledged(checked as boolean);
                  setError(null);
                }}
                className="mt-1"
              />
              <Label
                htmlFor="acknowledge"
                className="text-sm text-gray-700 cursor-pointer leading-relaxed"
              >
                <span className="font-semibold">
                  I acknowledge and understand
                </span>{" "}
                that {keepDataRetention
                  ? "I will be switched to the $1.00/month data retention plan and can upgrade again at any time."
                  : "all couple/customer data will be removed 30 days once billing/payments have stopped."}
              </Label>
            </div>
          </div>

          {/* Current Plan Info */}
          {subscription && (
            <div className="bg-gray-100 rounded-lg p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Current Plan:</span>
                <span className="font-semibold text-gray-900 capitalize">
                  {subscription.tier}
                </span>
              </div>
              {subscription.billingCycleEnd && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-600">Access until:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(subscription.billingCycleEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
              {subscription.daysRemaining !== undefined && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-600">Days remaining:</span>
                  <span className="font-semibold text-gray-900">
                    {subscription.daysRemaining} days
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isProcessing}
            >
              <X className="w-4 h-4 mr-2" />
              Keep My Subscription
            </Button>
            <Button
              onClick={handleCancel}
              disabled={!acknowledged || isProcessing}
              className={`flex-1 ${
                keepDataRetention
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isProcessing ? (
                "Processing..."
              ) : keepDataRetention ? (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Switch to $1/month
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
