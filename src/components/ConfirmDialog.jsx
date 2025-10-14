"use client"
import { Modal, Button } from "react-bootstrap"
import { ExclamationTriangleFill } from "react-bootstrap-icons"
import "./ConfirmDialog.css"

export default function ConfirmDialog({
  show,
  onHide,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "danger",
}) {
  return (
    <Modal show={show} onHide={onHide} centered className="confirm-dialog">
      <Modal.Body className="confirm-dialog-body">
        <div className="confirm-icon-wrapper">
          <ExclamationTriangleFill className="confirm-icon" />
        </div>
        <h4 className="confirm-title">{title}</h4>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <Button variant="outline-secondary" onClick={onHide} className="confirm-btn-cancel">
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} className="confirm-btn-confirm">
            {confirmText}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  )
}