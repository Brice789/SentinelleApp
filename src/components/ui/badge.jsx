import { useState } from "react";

export function Badge({ children, className }) {
  return (
    <span className={`px-2 py-1 text-sm font-semibold rounded ${className}`}>
      {children}
    </span>
  );
}