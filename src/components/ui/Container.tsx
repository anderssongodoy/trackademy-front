import React from "react";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export const Container: React.FC<ContainerProps> = ({
  maxWidth = "lg",
  children,
  className,
  ...props
}) => {
  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "w-full",
  };

  return (
    <div
      className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthStyles[maxWidth]} ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
};
