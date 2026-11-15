"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "rgba(8,10,22,0.92)",
          "--normal-text": "#F4F5FF",
          "--normal-border": "rgba(255,255,255,0.12)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
