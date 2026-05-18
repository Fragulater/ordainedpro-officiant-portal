"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Lock, AlertCircle, Check } from "lucide-react";

// Square Web Payments SDK types
interface PaymentMethod {
  card?: {
    tokenize(): Promise<{
      status: string;
      token?: string;
      errors?: Array<{ message: string }>;
    }>;
    attach(container: HTMLElement): Promise<void>;
    destroy(): Promise<void>;
    addEventListener(
      event: string,
      callback: (event: any) => void
    ): void;
  };
}

interface SquarePaymentFormProps {
  applicationId: string;
  locationId: string;
  onPaymentMethodObtained: (token: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  amount?: number;
  planName?: string;
}

declare global {
  interface Window {
    Square: {
      payments(
        applicationId: string,
        locationId: string
      ): Promise<{
        card(): Promise<PaymentMethod["card"]>;
      }>;
    };
  }
}

export function SquarePaymentForm({
  applicationId,
  locationId,
  onPaymentMethodObtained,
  onError,
  disabled = false,
  amount,
  planName,
}: SquarePaymentFormProps) {
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<PaymentMethod["card"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Load Square SDK script
  useEffect(() => {
    const loadSquareScript = async () => {
      // Check if already loaded
      if (window.Square) {
        setSdkLoaded(true);
        return;
      }

      // Check if script is already in document
      const existingScript = document.querySelector(
        'script[src*="square.com/v1/square.js"]'
      );
      if (existingScript) {
        existingScript.addEventListener("load", () => setSdkLoaded(true));
        return;
      }

      // Load script
      const script = document.createElement("script");
      script.src = "https://sandbox.web.squarecdn.com/v1/square.js";
      // For production: script.src = "https://web.squarecdn.com/v1/square.js";
      script.async = true;
      script.onload = () => setSdkLoaded(true);
      script.onerror = () => {
        onError("Failed to load payment SDK");
        setIsLoading(false);
      };
      document.body.appendChild(script);
    };

    loadSquareScript();
  }, [onError]);

  // Initialize card input
  useEffect(() => {
    const initializeCard = async () => {
      if (!sdkLoaded || !cardContainerRef.current || !window.Square) {
        return;
      }

      try {
        setIsLoading(true);

        // Initialize payments
        const payments = await window.Square.payments(applicationId, locationId);

        // Create card input
        const card = await payments.card();

        if (!card) {
          throw new Error("Failed to create card input");
        }

        // Attach to container
        await card.attach(cardContainerRef.current);

        // Listen for events
        card.addEventListener("focusClassAdded", () => {
          setCardError(null);
        });

        card.addEventListener("focusClassRemoved", () => {});

        card.addEventListener("errorClassAdded", () => {
          setCardError("Please check your card details");
          setCardComplete(false);
        });

        card.addEventListener("errorClassRemoved", () => {
          setCardError(null);
        });

        card.addEventListener("cardBrandChanged", () => {
          // Card brand detected (visa, mastercard, etc.)
        });

        card.addEventListener("postalCodeChanged", () => {
          // Postal code changed
        });

        // Store reference
        cardRef.current = card;
        setIsLoading(false);
      } catch (err: any) {
        console.error("Card initialization error:", err);
        onError(err.message || "Failed to initialize payment form");
        setIsLoading(false);
      }
    };

    initializeCard();

    // Cleanup
    return () => {
      if (cardRef.current) {
        cardRef.current.destroy().catch(console.error);
        cardRef.current = null;
      }
    };
  }, [sdkLoaded, applicationId, locationId, onError]);

  const handleSubmit = useCallback(async () => {
    if (!cardRef.current || disabled || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      const result = await cardRef.current.tokenize();

      if (result.status === "OK" && result.token) {
        onPaymentMethodObtained(result.token);
      } else if (result.errors) {
        const errorMessage = result.errors.map((e) => e.message).join(", ");
        setCardError(errorMessage);
        onError(errorMessage);
      } else {
        setCardError("Unable to process card");
        onError("Unable to process card");
      }
    } catch (err: any) {
      console.error("Tokenization error:", err);
      setCardError(err.message || "Payment processing failed");
      onError(err.message || "Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
  }, [disabled, isProcessing, onPaymentMethodObtained, onError]);

  return (
    <div className="space-y-4">
      {/* Plan Info */}
      {planName && amount !== undefined && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Selected Plan</p>
              <p className="font-bold text-lg text-gray-900">{planName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Monthly</p>
              <p className="font-bold text-2xl text-blue-600">
                ${(amount / 100).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Card Input Container */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <CreditCard className="w-4 h-4 inline mr-2" />
          Card Information
        </label>
        <div
          ref={cardContainerRef}
          className={`min-h-[50px] border rounded-lg p-3 bg-white transition-all ${
            isLoading
              ? "animate-pulse bg-gray-100"
              : cardError
              ? "border-red-300 bg-red-50"
              : "border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
          }`}
        />
        {cardError && (
          <div className="flex items-center text-red-600 text-sm mt-1">
            <AlertCircle className="w-4 h-4 mr-1" />
            {cardError}
          </div>
        )}
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center text-sm text-gray-500 space-x-2">
        <Lock className="w-4 h-4" />
        <span>Secured by Square. Your card details are encrypted.</span>
      </div>

      {/* Submit Button */}
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || isLoading || isProcessing}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3"
      >
        {isLoading ? (
          "Loading..."
        ) : isProcessing ? (
          <span className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Processing...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <Check className="w-5 h-5 mr-2" />
            Subscribe Now
          </span>
        )}
      </Button>

      {/* Terms */}
      <p className="text-xs text-gray-500 text-center">
        By subscribing, you agree to our Terms of Service and Privacy Policy.
        Your subscription will automatically renew each month until canceled.
      </p>
    </div>
  );
}
