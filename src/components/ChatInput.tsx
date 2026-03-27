"use client";

import { useState, useCallback, memo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// Memoized component to prevent re-renders from parent
const ChatInput = memo(function ChatInput({
  onSubmit,
  disabled = false,
  placeholder = "Type your response here..."
}: ChatInputProps) {
  // Use ref for the actual input value to avoid re-renders
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState("");

  const handleSubmit = useCallback(() => {
    const value = localValue.trim();
    if (!value || disabled) return;

    onSubmit(value);
    setLocalValue("");

    // Also clear the input ref value
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [localValue, disabled, onSubmit]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <Input
        ref={inputRef}
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="flex-1 border-green-200 focus:border-green-400"
        onKeyPress={handleKeyPress}
        disabled={disabled}
        autoComplete="off"
      />
      <Button
        onClick={handleSubmit}
        disabled={!localValue.trim() || disabled}
        className="bg-green-600 hover:bg-green-700 text-white"
        type="button"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
});

export default ChatInput;
