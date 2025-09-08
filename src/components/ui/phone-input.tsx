import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  label = "Phone Number",
  placeholder = "e.g. 0712345678 or +254712345678",
  required = false,
  disabled = false,
  error,
  className,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow only numbers, +, spaces, and hyphens
    const sanitized = inputValue.replace(/[^0-9+\s-]/g, "");
    onChange(sanitized);
  };

  const formatPlaceholder = () => {
    return placeholder;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor="phone">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id="phone"
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder={formatPlaceholder()}
        disabled={disabled}
        className={cn(error && "border-destructive")}
        maxLength={20}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Enter phone number for SMS/WhatsApp notifications (optional)
      </p>
    </div>
  );
};

export { PhoneInput };