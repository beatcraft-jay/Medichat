import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getConsultations } from '../actions/auth';
import ErrorBoundary from './ErrorBoundary';
import { format, parseISO } from 'date-fns';
import { BiNote, BiPlus } from 'react-icons/bi';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';

const Notes = () => {
  const dispatch = useDispatch();
  const consultationsData = useSelector((state) => state.consultations.data);
  const consultations = consultationsData?.results || [];
  const { user, token } = useSelector((state) => state.auth);
  const isDoctor = user?.is_doctor;
  const [notes, setNotes] = useState({});
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedConsultationId, setSelectedConsultationId] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [modalError, setModalError] = useState(null);

  // Fetch consultations and notes on mount
  useEffect(() => {
    if (isDoctor) {
      console.log('Notes fetching consultations for doctor:', user?.id);
      console.log('Token:', token);
      dispatch(getConsultations());
      fetchNotes();
    }
  }, [dispatch, isDoctor, user]);

  // Fetch notes from API
  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API_BASE}/notes/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const notesByConsultation = response.data.reduce((acc, note) => {
        acc[note.consultation_id] = acc[note.consultation_id] || [];
        acc[note.consultation_id].push(note);
        return acc;
      }, {});
      console.log('Fetched notes:', notesByConsultation);
      setNotes(notesByConsultation);
      setError(null);
    } catch (error) {
      console.error('Error fetching notes:', error);
      console.error('Response data:', error.response?.data);
      setError(error.response?.data?.detail || 'Failed to load notes');
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'No date';
    try {
      const date = parseISO(timestamp);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, 'MMM d, yyyy HH:mm');
    } catch (error) {
      console.error('Error parsing timestamp:', timestamp, error);
      return 'Invalid Date';
    }
  };

  // Handle modal open/close
  const handleOpenModal = () => {
    setShowModal(true);
    setSelectedConsultationId('');
    setNoteContent('');
    setModalError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedConsultationId('');
    setNoteContent('');
    setModalError(null);
  };

  // Handle patient selection
  const handlePatientSelect = (consultationId) => {
    setSelectedConsultationId(consultationId);
    setModalError(null);
  };

  // Handle note content change
  const handleNoteContentChange = (e) => {
    setNoteContent(e.target.value);
    setModalError(null);
  };

  // Save note from modal
  const handleSaveNote = async () => {
    if (!selectedConsultationId) {
      setModalError('Please select a patient');
      return;
    }
    if (!noteContent.trim()) {
      setModalError('Note content cannot be empty');
      return;
    }
  
    try {
      console.log('Saving note with payload:', {
        consultation: parseInt(selectedConsultationId),
        content: noteContent.trim(),
        token: token,
      });
      const response = await axios.post(
        `${API_BASE}/notes/`,
        { 
          consultation: parseInt(selectedConsultationId),
          content: noteContent.trim() 
        },
        { headers: { Authorization: `Token ${token}` } }
      );
      console.log('Note saved:', response.data);
      setNotes((prev) => ({
        ...prev,
        [selectedConsultationId]: [...(prev[selectedConsultationId] || []), response.data],
      }));
      handleCloseModal();
    } catch (error) {
      console.error('Error saving note:', error);
      console.error('Response data:', error.response?.data);
      setModalError(
        error.response?.data?.detail || 
        error.response?.data?.consultation?.[0] || 
        'Failed to save note'
      );
    }
  };

  // Filter consultations for the current doctor with existing notes
  const doctorConsultations = consultations
    .filter((consultation) => 
      consultation.doctor?.id === user?.id && 
      notes[consultation.id] && 
      notes[consultation.id].length > 0
    )
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (!isDoctor) {
    return (
      <div className="p-3 text-center text-muted">
        This page is for doctors only.
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container py-4">
        <div className="text-center text-success">
          <h5>DOCTOR NOTES</h5>
        </div>
        {error && (
          <div className="alert alert-danger text-center" role="alert">
            {error}
          </div>
        )}
        {doctorConsultations.length === 0 ? (
          <div className="p-3 text-center text-muted bg-light rounded-3 shadow-sm animate__animated animate__fadeIn">
            No Notes yet.
          </div>
        ) : (
          <div className="notes-container">
            <div className="column">
              {doctorConsultations.map((consultation) => (
                <div key={consultation.id} className="col-md-6 col-lg-4">
                  <div className="card note-card h-100 shadow-sm border-0 animate__animated animate__fadeInUp">
                    <div className="card-body">
                      <div className="d-flex align-items-center mb-3">
                        <img
                          className="rounded-circle patient-img"
                          src={consultation.patient?.profile_image || 'assets/img/user2.jpg'}
                          alt={consultation.patient?.name}
                          onError={(e) => {
                            e.target.src = 'assets/img/user2.jpg';
                          }}
                        />
                        <div className="ms-3">
                          <h5 className="card-title mb-1 text-success fw-bold">
                            {consultation.patient?.name || 'Unknown Patient'}
                          </h5>
                          <p className="card-text small text-muted mb-0">
                            Consultation: {formatDate(consultation.created_at)}
                          </p>
                        </div>
                      </div>
                      {/* Existing Notes */}
                      <div className="notes-list mb-3">
                        {(notes[consultation.id] || []).length > 0 ? (
                          notes[consultation.id].map((note) => (
                            <div key={note.id} className="note-item p-2 mb-2 bg-light rounded">
                              <p className="small mb-1">{note.content}</p>
                              <p className="small text-muted mb-0">
                                {formatDate(note.created_at)}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="small text-muted">No notes yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Floating Add Button */}
        <button
          className="btn btn-success rounded-circle btn-floating animate__animated animate__fadeIn"
          onClick={handleOpenModal}
          title="Add Note"
        >
          <BiPlus size={24} />
        </button>
        {/* Modal */}
        <div className={`modal fade ${showModal ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: showModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-success">Add Note</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                {modalError && (
                  <div className="alert alert-danger" role="alert">
                    {modalError}
                  </div>
                )}
                <div className="mb-3">
                  <label htmlFor="patientSelect" className="form-label">Select Patient</label>
                  <select
                    id="patientSelect"
                    className="form-select"
                    value={selectedConsultationId}
                    onChange={(e) => handlePatientSelect(e.target.value)}
                  >
                    <option value="">Select a patient</option>
                    {consultations
                      .filter((consultation) => consultation.doctor?.id === user?.id)
                      .map((consultation) => (
                        <option key={consultation.id} value={consultation.id}>
                          {consultation.patient?.name || 'Unknown Patient'} ({consultation.consultation_type || 'Unknown'})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="noteContent" className="form-label">Note Content</label>
                  <textarea
                    id="noteContent"
                    className="form-control"
                    rows="4"
                    placeholder="Enter note content..."
                    value={noteContent}
                    onChange={handleNoteContentChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSaveNote}
                  disabled={!selectedConsultationId || !noteContent.trim()}
                >
                  Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Notes;