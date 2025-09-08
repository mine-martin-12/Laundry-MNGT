import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "tetris" | "dots";
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  variant = "default",
  className,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  if (variant === "tetris") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="grid grid-cols-2 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className={cn(
                "bg-primary rounded-sm",
                size === "sm"
                  ? "w-2 h-2"
                  : size === "md"
                  ? "w-3 h-3"
                  : "w-4 h-4"
              )}
              animate={{
                scale: [1, 0.8, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div
        className={cn("flex items-center justify-center space-x-1", className)}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn(
              "bg-primary rounded-full",
              size === "sm" ? "w-2 h-2" : size === "md" ? "w-3 h-3" : "w-4 h-4"
            )}
            animate={{
              y: [0, -10, 0],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    );
  }

  // Default spinner
  return (
    <motion.div
      className={cn(
        "border-2 border-muted border-t-primary rounded-full",
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
};

export { LoadingSpinner };
