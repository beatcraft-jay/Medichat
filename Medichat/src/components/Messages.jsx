import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { getConsultations, setCurrentConsultation, markMessagesAsRead } from '../actions/auth';
import ErrorBoundary from './ErrorBoundary';

const Messages = () => {
  const dispatch = useDispatch();
  const consultationsData = useSelector((state) => state.consultations.data);
  const consultations = consultationsData?.results || [];
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    console.log('Messages fetching consultations for user:', user?.is_doctor ? 'Doctor' : 'Patient');
    dispatch(getConsultations());
  }, [dispatch, user]);

  const handleSelectConsultation = (consultationId) => {
    console.log('Selecting consultation:', consultationId);
    dispatch(setCurrentConsultation(consultationId)); 
    dispatch(markMessagesAsRead(consultationId)); 
  };

  // Function to format date for grouping
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const isToday = date.toDateString() === today.toDateString();
      const isYesterday = date.toDateString() === yesterday.toDateString();

      if (isToday) return 'Today';
      if (isYesterday) return 'Yesterday';
      return date.toLocaleDateString([], {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error parsing dateString:', dateString, error);
      return 'Invalid Date';
    }
  };

  // Function to format time in local time zone
  const formatTime = (dateString) => {
    if (!dateString) return 'No time';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Time';
      return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error parsing dateString for time:', dateString, error);
      return 'Invalid Time';
    }
  };

  // Group consultations by date of latest message and sort by time
  const groupedConsultations = consultations.reduce((acc, consultation) => {
    const dateKey = formatDate(consultation.latest_message?.timestamp || consultation.created_at);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(consultation);
    return acc;
  }, {});

  // Sort consultations within each date group by latest message timestamp (newest first)
  Object.keys(groupedConsultations).forEach((dateKey) => {
    groupedConsultations[dateKey].sort((a, b) => {
      const timeA = new Date(a.latest_message?.timestamp || a.created_at).getTime();
      const timeB = new Date(b.latest_message?.timestamp || b.created_at).getTime();
      return timeB - timeA; // Newest first
    });
  });

  // Sort dates (newest first) based on latest message timestamp
  const sortedDates = Object.keys(groupedConsultations).sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Yesterday') return -1;
    if (b === 'Yesterday') return 1;
    return Date.parse(b) - Date.parse(a);
  });

  // Log consultations for debugging
  console.log('Messages consultations:', consultations);
  console.log('groupedConsultations:', groupedConsultations);
  console.log('sortedDates:', sortedDates);

  // Determine base route based on user type
  const baseRoute = user?.is_doctor ? '/doctor/app/chat' : '/patient/app/chat';

  return (
    <ErrorBoundary>
      <div className="chat-box main-text d-none d-md-block top">
        {consultations.length === 0 ? (
          <div className="p-2 text-center text-muted">No consultations available</div>
        ) : (
          sortedDates.map((date) => (
            <div key={date}>
              <h5 className="p-2 mt-3 text-muted border-bottom">{date}</h5>
              <ul className="list-unstyled mb-0">
                {groupedConsultations[date].map((consultation) => (
                  <li key={consultation.id} className="p-2 border-bottom">
                    <Link
                      to={`${baseRoute}/${consultation.id}`}
                      onClick={() => handleSelectConsultation(consultation.id)}
                    >
                      <div className="d-flex justify-content-between">
                        <div className="d-flex flex-row">
                          <div>
                            <img
                              className="User-img-massage"
                              src={
                                user?.is_doctor
                                  ? consultation.patient?.profile_image || 'assets/img/user2.jpg'
                                  : consultation.doctor?.profile_image || 'assets/img/user2.jpg'
                              }
                              alt={user?.is_doctor ? 'Patient' : 'Doctor'}
                              onError={(e) => {
                                e.target.src = 'assets/img/user2.jpg';
                              }}
                            />
                          </div>
                          <div className="pt-1 mx-2">
                            <p className="mb-0 text-success main-text">
                              {user?.is_doctor
                                ? consultation.patient?.name || 'Unknown Patient'
                                : consultation.doctor?.name || 'Unknown Doctor'}
                            </p>
                            <p className="small text-muted">
                              {consultation.latest_message?.content || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                        <div className="pt-1">
                          {/* Only show badge if unread_count > 0 for the current user (receiver) */}
                          {consultation.unread_count > 0 && (
                            <span className="badge bg-danger rounded-pill float-end">
                              {consultation.unread_count}
                            </span>
                          )}
                          <p className="small text-muted mb-1">
                            {formatTime(consultation.created_at)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Messages;