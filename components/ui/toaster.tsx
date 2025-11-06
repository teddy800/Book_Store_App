'use client';

import {
  Toaster as Sonner
} from "sonner";

type ToasterProps = {
  theme?: "light" | "dark" | "system";
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  expand?: boolean;
  visibleToasts?: number;
  richColors?: boolean;
  offset?: string | number;
  closeButton?: boolean;
  duration?: number;
  toastOptions?: {
    className?: string;
    descriptionClassName?: string;
    titleClassName?: string;
    style?: React.CSSProperties;
    iconTheme?: {
      primary?: string;
      secondary?: string;
    };
    classNames?: {
      toast?: string;
      description?: string;
      actionButton?: string;
      closeButton?: string;
      progressBar?: string;
      icon?: string;
    };
  };
};

export function Toaster({ 
  theme = "system", 
  position = "top-right", 
  expand = false, 
  visibleToasts = 5, 
  richColors = false, 
  offset = "80px", 
  closeButton = true, 
  duration = 4000,
  toastOptions = {}, 
  ...props 
}: ToasterProps) {
  return (
    <Sonner
      theme={theme}
      position={position}
      expand={expand}
      visibleToasts={visibleToasts}
      richColors={richColors}
      offset={offset}
      closeButton={closeButton}
      duration={duration}
      toastOptions={toastOptions}
      {...props}
    />
  );
}