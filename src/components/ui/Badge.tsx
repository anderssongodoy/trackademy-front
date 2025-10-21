import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "accent";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "primary",
  size = "md",
  children,
  className,
  ...props
}) => {
  const variantStyles = {
    primary: "bg-primary-100 text-primary-700",
    secondary: "bg-secondary-100 text-secondary-700",
    success: "bg-success-100 text-success-700",
    warning: "bg-warning-100 text-warning-700",
    accent: "bg-accent-100 text-accent-700",
  };

  const sizeStyles = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  return (
    <div
      className={`inline-flex items-center rounded-full font-semibold ${variantStyles[variant]} ${sizeStyles[size]} ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
};
