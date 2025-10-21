import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "accent";
  size?: "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  children,
  className,
  ...props
}) => {
  const baseStyles =
    "font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 hover:shadow-lg";

  const variantStyles = {
    primary:
      "bg-gradient-primary text-white hover:shadow-xl-primary active:shadow-lg-primary",
    secondary:
      "bg-gradient-secondary text-white hover:shadow-xl-secondary active:shadow-lg-secondary",
    accent:
      "bg-gradient-accent text-white hover:shadow-lg-accent",
    outline:
      "border-3 border-primary-500 text-primary-700 hover:bg-primary-50 active:scale-95",
  };

  const sizeStyles = {
    sm: "px-4 py-2.5 text-sm font-semibold",
    md: "px-6 py-3.5 text-base font-bold",
    lg: "px-8 py-4 text-lg font-bold",
    xl: "px-10 py-5 text-xl font-bold",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className || ""}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
