import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 min-w-[300px] max-w-md p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border animate-in slide-in-from-right-full fade-in duration-300 dark:shadow-black/50 ${
            toast.type === 'success' ? 'bg-white dark:bg-dark-surface border-green-100 dark:border-green-900/30 text-gray-800 dark:text-dark-text' :
            toast.type === 'error' ? 'bg-white dark:bg-dark-surface border-red-100 dark:border-red-900/30 text-gray-800 dark:text-dark-text' :
            'bg-white dark:bg-dark-surface border-blue-100 dark:border-blue-900/30 text-gray-800 dark:text-dark-text'
          }`}
        >
          <div className={`p-2 rounded-full shrink-0 ${
             toast.type === 'success' ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
             toast.type === 'error' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
             'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
          }`}>
            {toast.type === 'success' && <CheckCircle size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
          </div>
          <p className="text-sm font-medium flex-1">{toast.message}</p>
          <button 
            onClick={() => removeToast(toast.id)} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-50 dark:hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;