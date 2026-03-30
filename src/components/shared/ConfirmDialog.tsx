import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/utils'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'default'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'default'
}: ConfirmDialogProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-slate-500 text-sm mt-2">{description}</p>
        </div>
        <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {cancelText || t('actions.cancel')}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={cn(
              "px-4 py-2 text-sm font-medium text-white rounded-lg transition-all",
              variant === 'danger' 
                ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200" 
                : "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
            )}
          >
            {confirmText || t('actions.confirmAction')}
          </button>
        </div>
      </div>
    </div>
  )
}
