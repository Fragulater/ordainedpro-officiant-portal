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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SquarePaymentForm } from "@/components/SquarePaymentForm";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  Crown,
  Star,
  Check,
  X,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";

// Square configuration from environment (fallback to sandbox for development)
const SQUARE_APP_ID = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || "sandbox-sq0idb-PLACEHOLDER";
const SQUARE_LOCATION_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || "PLACEHOLDER_LOCATION";

interface UpgradeSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  userFullName: string;
  onUpgraded: () => void;
}

type PlanType = "ASPIRANT" | "PROFESSIONAL";

interface Plan {
  id: PlanType;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "ASPIRANT",
    name: "Aspirant",
    price: 1495,
    description: "Perfect for new officiants starting their journey",
    features: [
      "Up to 3 ceremonies",
      "Script builder access",
      "Basic scheduling",
      "Profile management",
    ],
  },
  {
    id: "PROFESSIONAL",
    name: "Professional",
    price: 2900,
    description: "For established officiants running a serious business",
    features: [
      "Unlimited ceremonies",
      "Advanced script builder",
      "Full messaging system",
      "Contract management",
      "Invoice & payment tracking",
      "Earnings dashboard",
      "Marketplace script sales",
    ],
    popular: true,
  },
];

export function UpgradeSubscriptionDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
  userFullName,
  onUpgraded,
}: UpgradeSubscriptionDialogProps) {
  const { subscription, refreshSubscription, isProfessional, isAspirant } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [step, setStep] = useState<"select" | "payment" | "success">("select");
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePlanSelect = (planId: PlanType) => {
    setSelectedPlan(planId);
    setStep("payment");
    setError(null);
  };

  const handlePaymentObtained = async (cardNonce: string) => {
    if (!selectedPlan) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          planType: selectedPlan,
          cardNonce,
          email: userEmail,
          fullName: userFullName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create subscription");
      }

      // Refresh subscription data
      await refreshSubscription();

      // Show success
      setStep("success");
    } catch (err: any) {
      console.error("Subscription creation error:", err);
      setError(err.message || "Failed to process subscription. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleClose = () => {
    setSelectedPlan(null);
    setStep("select");
    setError(null);
    onOpenChange(false);
    if (step === "success") {
      onUpgraded();
    }
  };

  const selectedPlanData = selectedPlan ? PLANS.find((p) => p.id === selectedPlan) : null;

  // Filter out plans user already has
  const availablePlans = PLANS.filter((plan) => {
    if (isProfessional) return false; // Already on highest tier
    if (isAspirant && plan.id === "ASPIRANT") return false; // Already on aspirant
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            {step === "select" && (
              <>
                <Sparkles className="w-6 h-6 mr-2 text-yellow-500" />
                Upgrade Your Plan
              </>
            )}
            {step === "payment" && (
              <>
                <Crown className="w-6 h-6 mr-2 text-yellow-500" />
                Complete Your Upgrade
              </>
            )}
            {step === "success" && (
              <>
                <Check className="w-6 h-6 mr-2 text-green-500" />
                Upgrade Successful!
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === "select" && "Choose a plan that fits your officiating business"}
            {step === "payment" && "Enter your payment details to complete the upgrade"}
            {step === "success" && "Your subscription has been upgraded successfully"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Plan Selection Step */}
          {step === "select" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availablePlans.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="font-bold text-lg text-gray-900">
                    You're on the highest tier!
                  </h3>
                  <p className="text-gray-600 mt-2">
                    You already have access to all features.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="mt-4"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                availablePlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`relative cursor-pointer transition-all hover:shadow-lg ${
                      plan.popular
                        ? "border-2 border-purple-500 shadow-purple-100"
                        : "border-2 border-gray-200"
                    }`}
                    onClick={() => handlePlanSelect(plan.id)}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                        POPULAR
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        {plan.id === "PROFESSIONAL" ? (
                          <Crown className="w-8 h-8 text-yellow-500 mr-3" />
                        ) : (
                          <Star className="w-8 h-8 text-blue-500 mr-3" />
                        )}
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">
                            {plan.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {plan.description}
                          </p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <span className="text-4xl font-bold text-gray-900">
                          ${(plan.price / 100).toFixed(2)}
                        </span>
                        <span className="text-gray-600">/month</span>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-start space-x-2"
                          >
                            <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className={`w-full ${
                          plan.popular
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            : "bg-blue-500 hover:bg-blue-600"
                        } text-white`}
                      >
                        Select {plan.name}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Payment Step */}
          {step === "payment" && selectedPlanData && (
            <div className="max-w-md mx-auto">
              {/* Back Button */}
              <Button
                variant="ghost"
                onClick={() => {
                  setStep("select");
                  setError(null);
                }}
                className="mb-4 text-gray-600"
              >
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Back to plans
              </Button>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Payment Error</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Square Payment Form */}
              <SquarePaymentForm
                applicationId={SQUARE_APP_ID}
                locationId={SQUARE_LOCATION_ID}
                onPaymentMethodObtained={handlePaymentObtained}
                onError={handlePaymentError}
                disabled={isProcessing}
                amount={selectedPlanData.price}
                planName={selectedPlanData.name}
              />
            </div>
          )}

          {/* Success Step */}
          {step === "success" && selectedPlanData && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>

              <h3 className="font-bold text-2xl text-gray-900 mb-2">
                Welcome to {selectedPlanData.name}!
              </h3>
              <p className="text-gray-600 mb-6">
                Your subscription has been activated. You now have access to all{" "}
                {selectedPlanData.name} features.
              </p>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">
                  You can now access:
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedPlanData.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-center text-sm text-gray-700"
                    >
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleClose}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8"
              >
                Start Using {selectedPlanData.name}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
