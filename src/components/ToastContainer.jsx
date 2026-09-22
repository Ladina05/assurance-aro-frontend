"use client"

import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import Toast from "./Toast"
export default function ToastContainer({ toasts, removeToast }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}
    </div>,
    document.body,
  )
}