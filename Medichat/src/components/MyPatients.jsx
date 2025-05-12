import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { getConsultations } from '../actions/auth';
import ErrorBoundary from './ErrorBoundary';
import { format, parseISO } from 'date-fns';
import { BiChat, BiUser } from 'react-icons/bi';

const MyPatients = () => {
  const dispatch = useDispatch();
  const consultationsData = useSelector((state) => state.consultations.data);
  const consultations = consultationsData?.results || [];
  const { user } = useSelector((state) => state.auth);
  const isDoctor = user?.is_doctor;

  // Fetch consultations on mount
  useEffect(() => {
    if (isDoctor) {
      console.log('MyPatients fetching consultations for doctor:', user?.id);
      dispatch(getConsultations());
    }
  }, [dispatch, isDoctor, user]);

  // Format date for last consultation
  const formatDate = (timestamp) => {
    if (!timestamp) return 'No consultation';
    try {
      const date = parseISO(timestamp);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error parsing timestamp:', timestamp, error);
      return 'Invalid Date';
    }
  };

  // Filter consultations for the current doctor and get unique patients
  const patients = Array.from(
    new Map(
      consultations
        .filter((consultation) => consultation.doctor?.id === user?.id)
        .map((consultation) => [
          consultation.patient?.id,
          {
            id: consultation.patient?.id,
            name: consultation.patient?.name || 'Unknown Patient',
            profile_image: consultation.patient?.profile_image || 'assets/img/user2.jpg',
            last_consultation: consultations
              .filter((c) => c.patient?.id === consultation.patient?.id)
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.created_at,
            consultation_id: consultations.find((c) => c.patient?.id === consultation.patient?.id)?.id,
          },
        ])
    ).values()
  );

  // Log for debugging
  console.log('MyPatients consultations:', consultations);
  console.log('MyPatients unique patients:', patients);

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
      <h5>MY PATIENTS</h5>
      </div>
        {patients.length === 0 ? (
          <div className="p-3 text-center text-muted bg-light rounded-3 shadow-sm animate__animated animate__fadeIn">
            No patients yet
          </div>
        ) : (
          <div className="my-doctors-container">
          <ul className="list-unstyled mb-0">
          <li className="p-3 border-bottom contact-item">
          <div>
            {patients.map((patient) => (
              <div key={patient.id} className="col-md-6 col-lg-4">
                <div className="card patient-card h-100 shadow-sm border-0 animate__animated animate__fadeInUp">
                  <div className="card-body d-flex align-items-center">
                    <img
                      className="rounded-circle patient-img"
                      src={patient.profile_image}
                      alt={patient.name}
                      onError={(e) => {
                        e.target.src = 'assets/img/user2.jpg';
                      }}
                    />
                    <div className="ms-3 flex-grow-1">
                      <h5 className="card-title mb-1 text-success fw-bold">{patient.name}</h5>
                      <p className="card-text small text-muted mb-1">
                        Patient ID: {patient.id}
                      </p>
                      <p className="card-text small text-muted mb-0">
                        Last Consultation: {formatDate(patient.last_consultation)}
                      </p>
                    </div>
                    <div className="card-footer bg-transparent border-0 d-flex justify-content-end">
                    <Link
                      to={`/doctor/app/chat/${patient.consultation_id}`}
                      className="btn btn-outline-success btn-sm me-2"
                      title="Chat with Patient"
                    >
                      <BiChat size={18} />
                    </Link>
                  </div>
                  </div>
                  
                </div>
              </div>
            ))}
          </div>
          </li>
          </ul>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default MyPatients;