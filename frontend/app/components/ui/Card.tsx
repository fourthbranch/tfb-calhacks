import React, { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export default function Card({
  title,
  children,
  footer,
  className = "",
}: CardProps) {
  return (
    <div
      className={`border border-black/[.08] dark:border-white/[.145] rounded-lg overflow-hidden ${className}`}
    >
      {title && (
        <div className="px-6 py-4 border-b border-black/[.08] dark:border-white/[.145]">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}

      <div className="p-6">{children}</div>

      {footer && (
        <div className="px-6 py-4 border-t border-black/[.08] dark:border-white/[.145] bg-[#f9f9f9] dark:bg-[#111]">
          {footer}
        </div>
      )}
    </div>
  );
}
