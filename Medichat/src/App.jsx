import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { DoctorPrivateRoute, PatientPrivateRoute } from './private/PrivateRoute';
import './App.css';
import PatientHome from './pages/PatientHome';
import Login from './pages/Login';
import Signin from './pages/Signin';
import DoctorSignin from './pages/DoctorSignin';
import PatientRegister from './pages/PatientRegister';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setAuthToken } from './actions/auth';
import DoctorRegister from './pages/DoctorRegister';
import DoctorHome from './pages/DoctorHome';
import Chat from './components/Chat';
import DoctorsList from './components/DoctorsList';
import Calls from './components/Contacts'; 
import News from './components/News'; 
import Hospitals from './components/Maps';
import Settings from './components/Settings'; 
import Notes from './components/Notes'; 
import MyDoctors from './components/MyDoctors'; 
import MyPatients from './components/MyPatients'; 
import Contacts from './components/Contacts';
import { setTheme } from './actions/theme';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(setAuthToken(token));
    }
  }, [dispatch]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    dispatch(setTheme(savedTheme));
  }, [dispatch]);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup/patient" element={<Signin />} />
        <Route path="/signup/doctor" element={<DoctorSignin />} />
        <Route
          path="/patient/register"
          element={
            <PatientPrivateRoute>
              <PatientRegister />
            </PatientPrivateRoute>
          }
        />
        <Route
          path="/doctor/register"
          element={
            <DoctorPrivateRoute>
              <DoctorRegister />
            </DoctorPrivateRoute>
          }
        />
        <Route
          path="/patient/app/*"
          element={
            <PatientPrivateRoute>
              <PatientHome />
            </PatientPrivateRoute>
          }
        >
          <Route path="chat/:consultationId" element={<Chat />} />
          <Route path="doctors" element={<DoctorsList />} />
          <Route path="calls" element={<Contacts />} />
          <Route path="news" element={<News />} />
          <Route path="hospitals" element={<Hospitals />} />
          <Route path="settings" element={<Settings />} />
          <Route path="mydoctors" element={<MyDoctors />} />
        </Route>
        <Route
          path="/doctor/app/*"
          element={
            <DoctorPrivateRoute>
              <DoctorHome />
            </DoctorPrivateRoute>
          }
        >
          <Route path="chat/:consultationId" element={<Chat />} />
          <Route path="news" element={<News />} />
          <Route path="doctors" element={<DoctorsList />} />
          <Route path="notes" element={<Notes />} />
          <Route path="hospitals" element={<Hospitals />} />
          <Route path="mypatients" element={<MyPatients />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;