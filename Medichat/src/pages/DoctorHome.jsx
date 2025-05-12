import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import { getDoctorUser, getConsultations, setCurrentConsultation } from '../actions/auth';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Search from '../components/Search';
import Messages from '../components/Messages';
import { useLocation } from 'react-router-dom';

const DoctorHome = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeButton, setActiveButton] = useState('chat');

  // Sync activeButton with route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/consultations')) setActiveButton('consultations');
    else if (path.includes('/chat')) setActiveButton('chat');
    else if (path.includes('/news')) setActiveButton('news');
    else if (path.includes('/doctors')) setActiveButton('doctors');
    else if (path.includes('/notes')) setActiveButton('notes');
    else if (path.includes('/hospitals')) setActiveButton('hospitals');
    else if (path.includes('/mypatients')) setActiveButton('mypatients');
    else if (path.includes('/settings')) setActiveButton('settings');
  }, [location]);

  // Redux state selectors
  const {
    data: consultations,
    current: currentConsultation,
    loading: consultationsLoading,
    error: consultationsError,
  } = useSelector((state) => state.consultations);

  const { user, isAuthenticated, isLoading: userLoading } = useSelector((state) => state.auth);

  // Load consultations and user data
  useEffect(() => {
    if (isAuthenticated && user?.is_doctor) {
      dispatch(getConsultations());
      dispatch(getDoctorUser());
    } else if (!isAuthenticated) {
      navigate('/login');
    }
  }, [dispatch, user?.is_doctor, isAuthenticated, navigate]);

  // Set default consultation
  useEffect(() => {
    if (consultations?.results?.length > 0 && !currentConsultation) {
      dispatch(setCurrentConsultation(consultations.results[0].id));
    }
  }, [consultations?.results, currentConsultation, dispatch]);

  // Handle loading state
  if (userLoading || consultationsLoading) {
    return <div className="loading-overlay">Loading...</div>;
  }

  // Handle consultation loading error
  if (consultationsError) {
    return (
      <div className="alert alert-danger m-3">
        <h4>Error loading consultations</h4>
        <p>{consultationsError}</p>
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
    const routes = {
      chat: currentConsultation ? `/doctor/app/chat/${currentConsultation.id}` : '/doctor/app',
      consultations: '/doctor/app/consultations',
      news: '/doctor/app/news',
      doctors: '/doctor/app/doctors',
      notes: '/doctor/app/notes',
      hospitals: '/doctor/app/hospitals',
      mypatients: '/doctor/app/mypatients',
      settings: '/doctor/app/settings',
    };
    navigate(routes[button] || '/doctor/app');
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
      chat: currentConsultation ? `/doctor/app/chat/${currentConsultation.id}` : '/doctor/app',
      consultations: '/doctor/app/consultations',
      news: '/doctor/app/news',
      doctors: '/doctor/app/doctors',
      notes: '/doctor/app/notes',
      hospitals: '/doctor/app/hospitals',
      mypatients: '/doctor/app/mypatients',
      settings: '/doctor/app/settings',
    };
    navigate(routes[button] || '/doctor/app');
  };

  return (
    <footer className="footer text-center py-2 bg-light d-block d-sm-none">
      <div className="container">
        <div className="p-2">
          <div className="d-flex justify-content-between pt-3">
            {['chat', 'consultations', 'news', 'doctors', 'hospitals', 'settings'].map((button) => (
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
    consultations: 'calendar-check',
    news: 'newspaper',
    doctors: 'heart-pulse',
    notes: 'file-earmark-text',
    hospitals: 'hospital',
    mypatients: 'people-fill',
    settings: 'gear',
  };
  return icons[button] || 'circle';
};

export default DoctorHome;