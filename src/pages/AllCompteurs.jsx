import React, { useEffect, useState } from 'react';
import { getCompteurs, createCompteur, updateCompteur, deleteCompteur } from '../services/api';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

export default function AllCompteurs() {
  const [compteurs, setCompteurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCompteur, setEditingCompteur] = useState(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    codeImmeuble: '', nomPropriete: '', rg: '', typeBien: '',
    province: '', adresse: '', quartier: '', localisation: '',
    sousCompteurs: [''] // tableau pour plusieurs numeroCompteur
  });

  async function load() {
    setLoading(true);
    try {
      const data = await getCompteurs();
      setCompteurs(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handleShowModal = (compteur = null) => {
    setEditingCompteur(compteur);
    setForm({
      codeImmeuble: compteur?.codeImmeuble || '',
      nomPropriete: compteur?.nomPropriete || '',
      rg: compteur?.rg || '',
      typeBien: compteur?.typeBien || '',
      province: compteur?.province || '',
      adresse: compteur?.adresse || '',
      quartier: compteur?.quartier || '',
      localisation: compteur?.localisation || '',
      sousCompteurs: compteur?.sousCompteurs?.map(sc => sc.numeroCompteur) || ['']
    });
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleAddSousCompteur = () => {
    setForm({ ...form, sousCompteurs: [...form.sousCompteurs, ''] });
  };

  const handleChangeSousCompteur = (index, value) => {
    const scs = [...form.sousCompteurs];
    scs[index] = value;
    setForm({ ...form, sousCompteurs: scs });
  };

  const handleRemoveSousCompteur = (index) => {
    const scs = form.sousCompteurs.filter((_, i) => i !== index);
    setForm({ ...form, sousCompteurs: scs });
  };

  const handleSubmit = async () => {
    if (!form.codeImmeuble || !form.nomPropriete || !form.rg || !form.typeBien ||
        !form.province || !form.adresse || !form.quartier ||
        !form.localisation || form.sousCompteurs.some(sc => !sc)) {
      setError('Tous les champs et tous les numéros de compteur sont obligatoires.');
      return;
    }

    try {
      const payload = {
        ...form,
        sousCompteurs: form.sousCompteurs.map(numeroCompteur => ({ numeroCompteur }))
      };

      if (editingCompteur) {
        await updateCompteur(editingCompteur.id, payload);
      } else {
        await createCompteur(payload);
      }
      load();
      handleCloseModal();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Supprimer le compteur ${c.nomPropriete} ?`)) return;
    try {
      await deleteCompteur(c.id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h2>Tous les compteurs</h2>
      <Button variant="primary" onClick={() => handleShowModal()}>Ajouter un compteur</Button>

      <table className="table mt-3">
        <thead>
          <tr>
            <th>ID</th><th>Code Immeuble</th><th>Propriété</th><th>RG</th><th>Type Bien</th><th>Province</th>
            <th>Adresse</th><th>Quartier</th><th>Localisation</th><th>Sous-Compteurs</th><th>Loué</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {compteurs.map(c => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.codeImmeuble}</td>
              <td>{c.nomPropriete}</td>
              <td>{c.rg}</td>
              <td>{c.typeBien}</td>
              <td>{c.province}</td>
              <td>{c.adresse}</td>
              <td>{c.quartier}</td>
              <td>{c.localisation}</td>
              <td>{c.sousCompteurs?.map(sc => sc.numeroCompteur).join(', ')}</td>
              <td>{c.loue ? 'Oui' : 'Non'}</td>
              <td>
                <Button variant="warning" size="sm" onClick={() => handleShowModal(c)}>Modifier</Button>{' '}
                <Button variant="danger" size="sm" onClick={() => handleDelete(c)}>Supprimer</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {loading && <p>Chargement...</p>}

      {/* --- Modal --- */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingCompteur ? 'Modifier le compteur' : 'Ajouter un compteur'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form>
            <Form.Group><Form.Label>Code Immeuble *</Form.Label>
              <Form.Control value={form.codeImmeuble} onChange={e => setForm({...form, codeImmeuble: e.target.value})} /></Form.Group>

            <Form.Group><Form.Label>Nom Propriété *</Form.Label>
              <Form.Control value={form.nomPropriete} onChange={e => setForm({...form, nomPropriete: e.target.value})} /></Form.Group>

            <Form.Group><Form.Label>RG *</Form.Label>
              <Form.Control value={form.rg} onChange={e => setForm({...form, rg: e.target.value})} /></Form.Group>

            <Form.Group><Form.Label>Type du Bien *</Form.Label>
              <Form.Select value={form.typeBien} onChange={e => setForm({...form, typeBien: e.target.value})}>
                <option value="">-- Sélectionner --</option>
                <option value="placement">Placement</option>
                <option value="exploitation">Exploitation</option>
              </Form.Select></Form.Group>

            <Form.Group><Form.Label>Province *</Form.Label>
              <Form.Control value={form.province} onChange={e => setForm({...form, province: e.target.value})} /></Form.Group>

            <Form.Group><Form.Label>Adresse *</Form.Label>
              <Form.Control value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} /></Form.Group>

            <Form.Group><Form.Label>Quartier *</Form.Label>
              <Form.Control value={form.quartier} onChange={e => setForm({...form, quartier: e.target.value})} /></Form.Group>

            <Form.Group><Form.Label>Localisation *</Form.Label>
              <Form.Control value={form.localisation} onChange={e => setForm({...form, localisation: e.target.value})} /></Form.Group>

            <Form.Label>Sous-Compteurs *</Form.Label>
            {form.sousCompteurs.map((sc, i) => (
              <div key={i} className="d-flex mb-2">
                <Form.Control value={sc} onChange={e => handleChangeSousCompteur(i, e.target.value)} />
                <Button variant="danger" size="sm" onClick={() => handleRemoveSousCompteur(i)}>X</Button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={handleAddSousCompteur}>Ajouter un sous-compteur</Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit}>{editingCompteur ? 'Modifier' : 'Ajouter'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
