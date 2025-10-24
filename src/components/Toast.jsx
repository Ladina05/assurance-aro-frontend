"use client"

import { useEffect } from "react"
import { CheckCircleFill, XCircleFill, InfoCircleFill, ExclamationTriangleFill, X } from "react-bootstrap-icons"
import "./Toast.css"

export default function Toast({ message, type = "success", onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: <CheckCircleFill className="toast-icon" />,
    error: <XCircleFill className="toast-icon" />,
    info: <InfoCircleFill className="toast-icon" />,
    warning: <ExclamationTriangleFill className="toast-icon" />,
  }

  return (
    <div className={`custom-toast toast-${type}`}>
      <div className="toast-content">
        {icons[type]}
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Fermer">
        <X size={18} />
      </button>
      <div
        className="toast-progress"
        style={{
          animation: `shrink ${duration}ms linear forwards`,
        }}
      />
    </div>
  )
}