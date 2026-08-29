import { createPortal } from 'react-dom';
import type { ToastItemData } from './types';
import ToastItem from './ToastItem';
import { useOverlayStack } from '../../context/OverlayStackContext';

interface ToastContainerProps {
  toasts: ToastItemData[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  const { isAnyOverlayOpen } = useOverlayStack();

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className={`fixed inset-x-0 pointer-events-none flex items-center gap-2 p-3 sm:p-4 transition-all duration-300 ${
        isAnyOverlayOpen
          ? 'top-0 z-[220] flex-col pt-[calc(var(--safe-area-inset-top,0px)+1rem)]'
          : 'bottom-0 z-[160] flex-col-reverse pb-[calc(var(--safe-area-inset-bottom,0px)+7rem)]'
      }`}
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          placement={isAnyOverlayOpen ? 'top' : 'bottom'}
        />
      ))}
    </div>,
    document.body
  );
}
