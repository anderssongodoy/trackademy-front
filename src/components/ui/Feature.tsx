import React from "react";

interface FeatureProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const Feature: React.FC<FeatureProps> = ({
  icon,
  title,
  description,
  className,
  ...props
}) => (
  <div
    className={`flex flex-col items-start gap-4 p-6 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 hover:shadow-lg transition-all duration-300 ${className || ""}`}
    {...props}
  >
    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-xl">
      {icon}
    </div>
    <div>
      <h4 className="font-bold text-slate-900 text-lg mb-2">{title}</h4>
      <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);
