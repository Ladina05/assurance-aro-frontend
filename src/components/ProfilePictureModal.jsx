import { useState, useRef } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { PersonCircle, Camera, Trash, Upload } from "react-bootstrap-icons";

export default function ProfilePictureModal({ show, onHide, user, onUpdate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Vérification du type de fichier
    if (!file.type.startsWith('image/')) {
      setError("Veuillez sélectionner une image valide");
      return;
    }

    // Vérification de la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5MB");
      return;
    }

    setError("");
    setSelectedFile(file);

    // Créer une preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Veuillez sélectionner une image");
      return;
    }

    setLoading(true);
    try {
      // Convertir l'image en base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Image = e.target.result;
          await onUpdate(base64Image);
          onHide();
          resetModal();
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setError("Erreur lors du traitement de l'image");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onUpdate(null);
      onHide();
      resetModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetModal();
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton style={{ background: "#0d9488", color: "white" }}>
        <Modal.Title>
          <Camera className="me-2" />
          Photo de profil
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        {error && <Alert variant="danger">{error}</Alert>}
        
        <div className="mb-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="rounded-circle"
              style={{ width: "150px", height: "150px", objectFit: "cover" }}
            />
          ) : user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt="Profile"
              className="rounded-circle"
              style={{ width: "150px", height: "150px", objectFit: "cover" }}
            />
          ) : (
            <PersonCircle
              size={150}
              className="text-secondary"
            />
          )}
        </div>

        <Form.Group>
          <Form.Label className="btn btn-outline-primary cursor-pointer">
            <Upload className="me-2" />
            Choisir une image
            <Form.Control
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="d-none"
            />
          </Form.Label>
        </Form.Group>

        <div className="mt-3 small text-muted">
          Taille maximale: 5MB
        </div>
      </Modal.Body>
      <Modal.Footer>
        {user?.profilePicture && (
          <Button variant="outline-danger" onClick={handleDelete} disabled={loading}>
            <Trash className="me-2" />
            Supprimer
          </Button>
        )}
        <Button variant="secondary" onClick={handleClose}>
          Annuler
        </Button>
        <Button 
          variant="primary" 
          onClick={handleUpload} 
          disabled={!selectedFile || loading}
          style={{ background: "#0d9488", borderColor: "#0d9488" }}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Envoi...
            </>
          ) : (
            <>
              <Upload className="me-2" />
              Mettre à jour
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}