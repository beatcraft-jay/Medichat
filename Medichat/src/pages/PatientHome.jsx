import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getConsultations, setCurrentConsultation } from '../actions/auth';
import Navbar from '../components/Navbar';
import Search from '../components/Search';
import Messages from '../components/Messages';
import Sidebar from '../components/Sidebar';
import { useLocation } from 'react-router-dom';

const PatientHome = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeButton, setActiveButton] = useState('chat');
  const location = useLocation();

  useEffect(() => {
    // Sync activeButton with route
    const path = location.pathname;
    if (path.includes('/doctors')) setActiveButton('doctors');
    else if (path.includes('/chat')) setActiveButton('chat');
    else if (path.includes('/calls')) setActiveButton('calls');
    else if (path.includes('/news')) setActiveButton('news');
    else if (path.includes('/hospitals')) setActiveButton('hospitals');
    else if (path.includes('/mydoctors')) setActiveButton('mydoctors');
    else if (path.includes('/settings')) setActiveButton('settings');
  }, [location]);

  // Redux state selectors
  const {
    data: consultations,
    current: currentConsultation,
    loading,
    error,
  } = useSelector((state) => state.consultations);

  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user?.is_patient) {
      dispatch(getConsultations());
    } else if (!isAuthenticated) {
      navigate('/login');
    }
  }, [dispatch, user?.is_patient, isAuthenticated, navigate]);

  useEffect(() => {
    if (consultations?.results?.length > 0 && !currentConsultation) {
      dispatch(setCurrentConsultation(consultations.results[0].id));
    }
  }, [consultations?.results, currentConsultation, dispatch]);

  if (loading) {
    return <div className="loading-overlay">Loading...</div>;
  }

  if (error) {
    return (
      <div className="alert alert-danger m-3">
        <h4>Error loading consultations</h4>
        <p>{error}</p>
        <button
          className="btn btn-primary"
          onClick={() => dispatch(getConsultations())}
        >
          Retry
        </button>
      </div>
    );
  }

  const handleButtonSelect = (button) => {
    setActiveButton(button);
    // Navigate to corresponding route
    const routes = {
      chat: currentConsultation ? `/patient/app/chat/${currentConsultation.id}` : '/patient/app',
      calls: '/patient/app/calls',
      news: '/patient/app/news',
      doctors: '/patient/app/doctors',
      hospitals: '/patient/app/hospitals',
      mydoctors: '/patient/app/mydoctors',
      settings: '/patient/app/settings',
    };
    navigate(routes[button] || '/patient/app');
  };

  return (
    <div>
      <Navbar />
      <div className="container-fluid body">
        <div className="row">
          <Sidebar onSelect={handleButtonSelect} activeButton={activeButton} />
          <div className="col-5 left-box">
            <Search />
            <Messages />
          </div>
          <div className="col right-box bg d-none d-md-block">
            <Outlet /> 
          </div>
        </div>
      </div>
      <MobileFooter activeButton={activeButton} setActiveButton={handleButtonSelect} />
      <footer className="footer text-center py-2 bg-light">
        <div className="container">
          <span className="small-text text-muted">© Copyright Beatcraft 2024</span>
        </div>
      </footer>
    </div>
  );
};

const MobileFooter = ({ activeButton, setActiveButton }) => {
  const navigate = useNavigate();
  const { current: currentConsultation } = useSelector((state) => state.consultations);

  const handleClick = (button) => {
    setActiveButton(button);
    const routes = {
      chat: currentConsultation ? `/patient/app/chat/${currentConsultation.id}` : '/patient/app',
      calls: '/patient/app/calls',
      news: '/patient/app/news',
      doctors: '/patient/app/doctors',
      hospitals: '/patient/app/hospitals',
      settings: '/patient/app/settings',
    };
    navigate(routes[button] || '/patient/app');
  };

  return (
    <footer className="footer text-center py-2 bg-light d-block d-sm-none">
      <div className="container">
        <div className="p-2">
          <div className="d-flex justify-content-between pt-3">
            {['chat', 'calls', 'news', 'doctors', 'hospitals', 'settings'].map((button) => (
              <button
                key={button}
                className={`btn border-0 pt-3 ${activeButton === button ? 'active' : ''}`}
                onClick={() => handleClick(button)}
              >
                <i className={`bi bi-${getButtonIcon(button)} linktag`} />
              </button>
            ))}
          </div>
        </div>
        <span className="small-text text-muted">© Copyright Beatcraft 2024</span>
      </div>
    </footer>
  );
};

const getButtonIcon = (button) => {
  const icons = {
    chat: 'chat',
    calls: 'telephone',
    news: 'newspaper',
    doctors: 'heart-pulse',
    hospitals: 'hospital',
    settings: 'gear',
  };
  return icons[button] || 'circle';
};

export default PatientHome;