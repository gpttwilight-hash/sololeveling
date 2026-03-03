// UI-specific types

export type ToastType = "success" | "error" | "info" | "achievement" | "levelup";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

export type NavItem = {
  href: string;
  label: string;
  icon: string;
};
