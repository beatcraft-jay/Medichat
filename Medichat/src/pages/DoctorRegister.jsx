import React, { useEffect, useState } from 'react';
import { connect, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getDoctorUser, update_doctoruser } from '../actions/auth';

const DoctorRegister = ({ update_doctoruser }) => {
  const navigate = useNavigate();
  const { token } = useSelector(state => state.auth); // Fixed: Access token directly
  const [redirect, setRedirect] = useState(false);

  const [registered_doctor, setRegisteredDoctor] = useState({
    first_name: '',
    last_name: '',
    profile_image: '',
    date_of_birth: '',
    phone_number: '',
    hospital: '',
    specialty: '',
  });

  const [errors, setErrors] = useState({}); // Added: Track validation errors

  const handleFileChange = (e) => {
    setRegisteredDoctor({ ...registered_doctor, profile_image: e.target.files[0] });
  };

  const handleChange = (e) =>
    setRegisteredDoctor({
      ...registered_doctor,
      [e.target.name]: e.target.value,
    });

  const validateForm = () => {
    const newErrors = {};
    if (!registered_doctor.first_name) newErrors.first_name = 'First name is required';
    if (!registered_doctor.last_name) newErrors.last_name = 'Last name is required';
    if (!registered_doctor.specialty) newErrors.specialty = 'Specialty is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formData = new FormData();
    for (const key in registered_doctor) {
      if (registered_doctor[key] !== '' && registered_doctor[key] !== null && registered_doctor[key] !== undefined) {
        formData.append(key, registered_doctor[key]);
      }
    }

    update_doctoruser(formData)
      .then(() => {
        navigate('/doctor/app');
      })
      .catch((error) => {
        console.error('Update failed:', error);
        const errorMessage = error.response?.data?.specialty?.[0] ||
                            error.response?.data?.detail ||
                            'Server error';
        setErrors({ submit: errorMessage });
      });
  };

  const { first_name, last_name, date_of_birth, phone_number, hospital, specialty } = registered_doctor;

  return (
    <div>
      <Navbar />
      <div className="container-fluid body">
        <div className="row">
          <div className="col left-box">
            <div className="header-text b-4 text-info">
              <h4 className="main-text-srt">Please Register Here</h4>
            </div>

            <form onSubmit={handleSubmit}>
              {errors.submit && (
                <div className="alert alert-danger" role="alert">
                  {errors.submit}
                </div>
              )}
              <div className="mb-3 row input-group">
                <label className="form-label">First and last name</label>
                <input
                  type="text"
                  placeholder="First name"
                  className={`fs-6 form-control main-text-srt ${errors.first_name ? 'is-invalid' : ''}`}
                  onChange={handleChange}
                  name="first_name"
                  value={first_name}
                />
                {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
                <input
                  type="text"
                  placeholder="Last name"
                  className={`fs-6 form-control main-text-srt ${errors.last_name ? 'is-invalid' : ''}`}
                  onChange={handleChange}
                  name="last_name"
                  value={last_name}
                />
                {errors.last_name && <div className="invalid-feedback">{errors.last_name}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">Date Of Birth</label>
                <input
                  type="date"
                  className="fs-6 form-control main-text-srt"
                  name="date_of_birth"
                  onChange={handleChange}
                  value={date_of_birth}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  placeholder="0701244244"
                  className="fs-6 form-control main-text-srt"
                  name="phone_number"
                  onChange={handleChange}
                  value={phone_number}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Hospital</label>
                <input
                  type="text"
                  placeholder="Mulago Hospital"
                  className="fs-6 form-control main-text-srt"
                  name="hospital"
                  onChange={handleChange}
                  value={hospital}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Speciality</label>
                <select
                  className={`fs-6 form-select main-text-srt ${errors.specialty ? 'is-invalid' : ''}`}
                  onChange={handleChange}
                  name="specialty"
                  value={specialty}
                >
                  <option value="">Select Specialty</option>
                  <option value="psychiatry">Psychiatry</option>
                  <option value="dental">Dental</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="family Medicine">Family Medicine</option>
                  <option value="oncology">Oncology</option>
                  <option value="geriatrics">Geriatrics</option>
                  <option value="radiology">Radiology</option>
                  <option value="surgery">Surgery</option>
                  <option value="general Medicine">General Medicine</option>
                  <option value="orthopedics">Orthopedics</option>
                  <option value="pediatrics">Pediatrics</option>
                </select>
                {errors.specialty && <div className="invalid-feedback">{errors.specialty}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="formFile" className="form-label">
                  Profile Picture
                </label>
                <input
                  className="form-control"
                  type="file"
                  id="formFile"
                  onChange={handleFileChange}
                />
              </div>
              <div className="input-group mb-3">
                <button className="btn btn-lg btn-primary w-100 fs-6 main-text-srt" type="submit">
                  REGISTER
                </button>
              </div>
            </form>
          </div>
          <div className="col right-box bg"></div>
        </div>
        <footer className="footer text-center py-2 bg-light">
          <div className="container">
            <div>
              <span className="small-text text-muted">© Copyright Beatcraft 2024</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
  isDoctor: state.auth.isDoctor,
});

DoctorRegister.propTypes = {
  update_doctoruser: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool,
  isDoctor: PropTypes.bool,
};

export default connect(mapStateToProps, { update_doctoruser })(DoctorRegister);