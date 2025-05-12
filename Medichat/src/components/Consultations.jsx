import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getConsultations, setCurrentConsultation } from '../actions/auth';

const Consultations = () => {
  const dispatch = useDispatch();
  const consultations = useSelector((state) => state.consultations.data.results || []);
  const loading = useSelector((state) => state.consultations.loading);

  useEffect(() => {
    dispatch(getConsultations());
  }, [dispatch]);

  const handleSelect = (id) => {
    dispatch(setCurrentConsultation(id));
  };

  return (
    <div>
      <h2>Consultations</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {consultations.map((consultation) => (
            <li
              key={consultation.id}
              onClick={() => handleSelect(consultation.id)}
              style={{ cursor: 'pointer' }}
            >
              <div>
                <strong>Patient:</strong> {consultation.patient?.name || 'Unknown Patient'}
              </div>
              <div>
                <strong>Doctor:</strong> {consultation.doctor?.name || 'Unknown Doctor'}
              </div>
              <div>
                <strong>Date:</strong>{' '}
                {consultation.created_at
                  ? new Date(consultation.created_at).toLocaleString()
                  : 'No date'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Consultations;