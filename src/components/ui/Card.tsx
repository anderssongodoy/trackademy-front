import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  elevated = false,
  children,
  className,
  ...props
}) => {
  const shadowClass = elevated ? "shadow-xl-primary" : "shadow-lg";

  return (
    <div
      className={`bg-white rounded-2xl p-6 ${shadowClass} transition-all duration-300 ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={`mb-4 pb-4 border-b border-slate-100 ${className || ""}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => (
  <h3
    className={`text-2xl font-bold text-slate-900 ${className || ""}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => (
  <p className={`text-slate-500 text-sm mt-1 ${className || ""}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={`${className || ""}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div
    className={`mt-6 pt-4 border-t border-slate-100 flex gap-3 ${className || ""}`}
    {...props}
  >
    {children}
  </div>
);
