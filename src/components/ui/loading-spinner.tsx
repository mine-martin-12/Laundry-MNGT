import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "tetris" | "dots";
  className?: string;
}

const LoadingSpinner = ({
  size = "md",
  variant = "default",
  className,
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  if (variant === "tetris") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <motion.div
          className="grid grid-cols-3 gap-2"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {[...Array(9)].map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "bg-primary rounded-md shadow-lg border-2 border-primary/20",
                size === "sm"
                  ? "w-2 h-2"
                  : size === "md"
                  ? "w-3 h-3"
                  : "w-4 h-4"
              )}
              animate={{
                scale: [0.5, 1.3, 0.5],
                opacity: [0.4, 1, 0.4],
                backgroundColor: [
                  "hsl(var(--primary))",
                  "hsl(var(--primary) / 0.8)",
                  "hsl(var(--primary))"
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
              style={{
                aspectRatio: "1",
                boxShadow: "0 0 20px hsl(var(--primary) / 0.3)",
              }}
            />
          ))}
        </motion.div>
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
