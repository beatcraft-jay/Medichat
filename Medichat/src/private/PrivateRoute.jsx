import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export const DoctorPrivateRoute = ({ children }) => {
  const { token, isDoctor, isAuthenticated, user } = useSelector((state) => state.auth);

  if (!token || !isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return isDoctor ? children : <Navigate to="/" replace />;
};

export const PatientPrivateRoute = ({ children }) => {
  const { token, isDoctor, isAuthenticated, user } = useSelector((state) => state.auth);

  if (!token || !isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  return isDoctor === false ? children : <Navigate to="/" replace />;
};