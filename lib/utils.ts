import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'react-hot-toast';  // Install: npm i react-hot-toast

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Add toast wrapper
export const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast[type](message);
};