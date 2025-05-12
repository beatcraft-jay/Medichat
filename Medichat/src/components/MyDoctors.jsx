import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { getConsultations } from '../actions/auth';
import ErrorBoundary from './ErrorBoundary';
import { format, parseISO } from 'date-fns';
import { BiChat, BiUser } from 'react-icons/bi';

const MyDoctors = () => {
  const dispatch = useDispatch();
  const consultationsData = useSelector((state) => state.consultations.data);
  const consultations = consultationsData?.results || [];
  const { user } = useSelector((state) => state.auth);
  const isPatient = user?.is_patient;

  // Fetch consultations on mount
  useEffect(() => {
    if (isPatient) {
      console.log('MyDoctors fetching consultations for patient:', user?.id);
      dispatch(getConsultations());
    }
  }, [dispatch, isPatient, user]);

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

  const doctors = Array.from(
    new Map(
      consultations
        .filter((consultation) => consultation.patient?.id === user?.id)
        .map((consultation) => [
          consultation.doctor?.id,
          {
            id: consultation.doctor?.id,
            name: consultation.doctor?.name || 'Unknown Doctor',
            hospital: consultation.doctor?.hospital || 'Unknown Hospital',
            specialty: consultation.doctor?.specialty || 'Unknown speciality',
            profile_image: consultation.doctor?.profile_image || 'assets/img/user2.jpg',
            last_consultation: consultations
              .filter((c) => c.doctor?.id === consultation.doctor?.id)
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.created_at,
            consultation_id: consultations.find((c) => c.doctor?.id === consultation.doctor?.id)?.id,
          },
        ])
    ).values()
  );
  // Log for debugging
  console.log('MyDoctors consultations:', consultations);
  console.log('MyDoctors unique doctors:', doctors);

  if (!isPatient) {
    return (
      <div className="p-3 text-center text-muted">
        This page is for patients only.
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container py-4">
      <div className="text-center text-success">
      <h5>MY DOCTORS</h5>
      </div>
        {doctors.length === 0 ? (
          <div className="p-3 text-center text-muted bg-light rounded-3 shadow-sm animate__animated animate__fadeIn">
            No doctors yet.
          </div>
        ) : (
          <div className="my-doctors-container">
          <ul className="list-unstyled mb-0">
          <li className="p-3 border-bottom contact-item">
          <div >
            {doctors.map((doctor) => (
              <div key={doctor.id} className="col-md-6 col-lg-4">
                <div className="card doctor-card h-100 shadow-sm border-0 animate__animated animate__fadeInUp">
                  <div className="card-body d-flex align-items-center">
                    <img
                      className="rounded-circle doctor-img"
                      src={doctor.profile_image}
                      alt={doctor.name}
                      onError={(e) => {
                        e.target.src = 'assets/img/user2.jpg';
                      }}
                    />
                    <div className="ms-3 flex-grow-1">
                      <h5 className="card-title mb-1 text-success fw-bold">{doctor.name}</h5>
                      <p className="card-text small text-muted mb-1">{doctor.specialty} at {doctor.hospital}</p>
                      <p className="card-text small text-muted mb-0">
                        Last Consultation: {formatDate(doctor.last_consultation)}
                      </p>
                    </div>
                    <div className="card-footer bg-transparent border-0 d-flex justify-content-end">
                    <Link
                      to={`/patient/app/chat/${doctor.consultation_id}`}
                      className="btn btn-outline-success btn-sm me-2"
                      title="Chat with Doctor"
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

export default MyDoctors;