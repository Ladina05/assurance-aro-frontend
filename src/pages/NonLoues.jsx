import React, { useEffect, useState } from 'react';
import { getCompteurs, updateSousCompteur, payBatch } from '../services/api';
import { Modal, Button, Form, Table } from 'react-bootstrap';

export default function NonLoues() {
  const [compteurs, setCompteurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentSousCompteur, setCurrentSousCompteur] = useState(null);
  const [form, setForm] = useState({ numeroFacture: '', montant: '' });
  const [searchText, setSearchText] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await getCompteurs(false); // non loués
      const flatList = data.flatMap(c =>
        c.sousCompteurs.map(s => ({
          compteurId: c.id,
          codeImmeuble: c.codeImmeuble,
          nomPropriete: c.nomPropriete,
          rg: c.rg,
          typeBien: c.typeBien,
          province: c.province,
          adresse: c.adresse,
          quartier: c.quartier,
          localisation: c.localisation,
          ...s
        }))
      );
      setCompteurs(flatList);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const handleShowModal = (sousCompteur) => {
    setCurrentSousCompteur(sousCompteur);
    setForm({
      numeroFacture: sousCompteur.numeroFacture || '',
      montant: sousCompteur.montant || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleSubmit = async () => {
    if (!form.numeroFacture && !form.montant) {
      alert("Veuillez remplir au moins N° Facture ou Montant.");
      return;
    }
    try {
      await updateSousCompteur(currentSousCompteur.id, {
        numeroFacture: form.numeroFacture || null,
        montant: form.montant ? Number(form.montant) : null
      });
      load();
      handleCloseModal();
    } catch (err) {
      alert(err.message);
    }
  };

  const totalMontant = compteurs.reduce((acc, s) => acc + (s.montant || 0), 0);

  const handlePayBatch = async () => {
    const payables = compteurs.filter(s => typeof s.montant === 'number' && s.montant > 0);
    if (payables.length === 0) {
      alert("Aucun montant à payer !");
      return;
    }
    try {
      await payBatch(payables);
      alert("Paiement effectué !");
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filtrage
  const filteredCompteurs = compteurs.filter(s => {
    const text = searchText.toLowerCase();
    const mainFields = [
      s.codeImmeuble, s.nomPropriete, s.rg, s.typeBien,
      s.province, s.adresse, s.quartier, s.localisation, s.numeroCompteur
    ];
    return mainFields.some(f => f?.toLowerCase().includes(text));
  });

  return (
    <div>
      <h2>Compteurs non loués</h2>

      {/* Barre de recherche */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="form-control"
        />
      </div>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID Compteur</th>
            <th>Code Immeuble</th>
            <th>Propriété</th>
            <th>RG</th>
            <th>Type Bien</th>
            <th>Province</th>
            <th>Adresse</th>
            <th>Quartier</th>
            <th>Localisation</th>
            <th>N° Compteur</th>
            <th>N° Facture</th>
            <th>Montant</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCompteurs.map(s => (
            <tr key={s.id}>
              <td>{s.compteurId}</td>
              <td>{s.codeImmeuble}</td>
              <td>{s.nomPropriete}</td>
              <td>{s.rg}</td>
              <td>{s.typeBien}</td>
              <td>{s.province}</td>
              <td>{s.adresse}</td>
              <td>{s.quartier}</td>
              <td>{s.localisation}</td>
              <td>{s.numeroCompteur}</td>
              <td>{s.numeroFacture || '-'}</td>
              <td>{s.montant || '-'}</td>
              <td>
                <Button variant="primary" size="sm" onClick={() => handleShowModal(s)}>
                  Ajouter Facture / Montant
                </Button>
              </td>
            </tr>
          ))}
          <tr>
            <td colSpan={11}><b>Montant Total</b></td>
            <td><b>{totalMontant}</b></td>
            <td>
              <Button variant="success" size="sm" onClick={handlePayBatch}>
                Payer
              </Button>
            </td>
          </tr>
        </tbody>
      </Table>

      {/* --- Modal --- */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter N° Facture / Montant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>N° Facture</Form.Label>
              <Form.Control
                type="text"
                value={form.numeroFacture}
                onChange={e => setForm({ ...form, numeroFacture: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Montant</Form.Label>
              <Form.Control
                type="number"
                value={form.montant}
                onChange={e => setForm({ ...form, montant: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Annuler</Button>
          <Button variant="primary" onClick={handleSubmit}>Valider</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
