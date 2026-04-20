import { useCallback } from 'react';
import toast, { ToastOptions, Toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading';
  duration?: number;
  onClose?: () => void;
}

const ToastComponent: React.FC<ToastProps & { id: string }> = ({
  id,
  title,
  message,
  type = 'info',
  onClose,
}) => {
  const icons = {
    success: '🎉',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    loading: '⏳',
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
    loading: 'bg-gray-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`${colors[type]} text-white rounded-lg shadow-lg max-w-sm w-full pointer-events-auto`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{icons[type]}</div>
          <div className="flex-1">
            {title && <h4 className="font-semibold mb-1">{title}</h4>}
            <p className="text-sm opacity-90">{message}</p>
          </div>
          <button
            onClick={() => {
              toast.dismiss(id);
              onClose?.();
            }}
            className="text-white hover:text-gray-200 transition"
          >
            ✕
          </button>
        </div>
        {type === 'loading' && (
          <div className="mt-2">
            <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const useToast = () => {
  const showToast = useCallback((
    message: string,
    type: ToastProps['type'] = 'info',
    options?: { title?: string; duration?: number; onClose?: () => void }
  ) => {
    return toast.custom(
      (t: Toast) => (
        <ToastComponent
          id={t.id}
          message={message}
          type={type}
          title={options?.title}
          duration={options?.duration}
          onClose={options?.onClose}
        />
      ),
      {
        duration: options?.duration || 4000,
        position: 'top-right',
      }
    );
  }, []);

  const success = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    return showToast(message, 'success', options);
  }, [showToast]);

  const error = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    return showToast(message, 'error', options);
  }, [showToast]);

  const warning = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    return showToast(message, 'warning', options);
  }, [showToast]);

  const info = useCallback((message: string, options?: { title?: string; duration?: number }) => {
    return showToast(message, 'info', options);
  }, [showToast]);

  const loading = useCallback((message: string, options?: { title?: string }) => {
    return toast.loading(message, {
      duration: Infinity,
      style: {
        background: '#6b7280',
        color: '#fff',
        borderRadius: '8px',
      },
      ...options,
    });
  }, []);

  const promise = useCallback((
    promise: Promise<any>,
    messages: { loading: string; success: string; error: string }
  ) => {
    return toast.promise(promise, messages, {
      success: {
        style: { background: '#10b981', color: '#fff' },
        icon: '✅',
      },
      error: {
        style: { background: '#ef4444', color: '#fff' },
        icon: '❌',
      },
      loading: {
        style: { background: '#6b7280', color: '#fff' },
      },
    });
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }, []);

  const handleApiError = useCallback((error: any) => {
    let message = 'An unexpected error occurred';
    
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }
    
    error(message);
    return message;
  }, [error]);

  return {
    success,
    error,
    warning,
    info,
    loading,
    promise,
    dismiss,
    showToast,
    handleApiError,
  };
};

export default useToast;