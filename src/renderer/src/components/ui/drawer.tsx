import * as React from "react";

import { cn } from "@/lib/utils";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  children,
  className,
}) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-y-0" : "translate-y-full",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};

const DrawerHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div
    className={cn("flex items-center justify-between p-6 border-b", className)}
  >
    {children}
  </div>
);

const DrawerContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn("p-6", className)}>{children}</div>
);

const DrawerTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>
);

const DrawerClose: React.FC<{ onClick: () => void; className?: string }> = ({
  onClick,
  className,
}) => (
  <button
    onClick={onClick}
    className={cn("rounded-md p-2 hover:bg-muted transition-colors", className)}
  >
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  </button>
);

export { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle };
