import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Modal, Button, Form } from 'react-bootstrap';
import { BiUser, BiBell, BiLock, BiMoon, BiSun, BiLogOut } from 'react-icons/bi';
import { updateDoctor, updatePatient, logout } from '../actions/auth';
import { setTheme } from '../actions/theme';

const Settings = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { theme } = useSelector((state) => state.theme);

  // State for modals and form inputs
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profile_image: null,
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    inApp: true,
  });
  const [privacy, setPrivacy] = useState({
    shareData: false,
    publicProfile: false,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value, files } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  // Submit profile update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('name', profileForm.name);
    formData.append('email', profileForm.email);
    if (profileForm.profile_image) {
      formData.append('profile_image', profileForm.profile_image);
    }

    try {
      if (user?.is_doctor) {
        await dispatch(updateDoctor(formData));
      } else {
        await dispatch(updatePatient(formData));
      }
      setSuccess('Profile updated successfully!');
      setShowProfileModal(false);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    }
  };

  // Toggle notification settings
  const handleNotificationToggle = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle privacy settings
  const handlePrivacyToggle = (key) => {
    setPrivacy((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle theme
  const handleThemeToggle = () => {
    dispatch(setTheme(theme === 'light' ? 'dark' : 'light'));
  };

  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
  };

  if (!isAuthenticated) {
    return <div>Please log in to access settings.</div>;
  }

  return (
    <div className="settings-container">
      <h2 className="settings-title">Settings</h2>
      {(error || success) && (
        <div className={`alert ${error ? 'alert-danger' : 'alert-success'} mt-3`}>
          {error || success}
        </div>
      )}

      {/* Theme Settings */}
      <div className="card settings-card">
        <div className="card-body">
          <h5 className="card-title">
            {theme === 'light' ? <BiSun className="me-2" /> : <BiMoon className="me-2" />} Theme
          </h5>
          <Button
            variant={theme === 'light' ? 'dark' : 'light'}
            onClick={handleThemeToggle}
          >
            Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
          </Button>
        </div>
      </div>

      {/* Account Settings */}
      <div className="card settings-card">
        <div className="card-body">
          <h5 className="card-title">
            <BiUser className="me-2" /> Account
          </h5>
          <p className="card-text">
            Name: {user?.name || 'N/A'}<br />
            Email: {user?.email || 'N/A'}<br />
            Role: {user?.is_doctor ? 'Doctor' : 'Patient'}
          </p>
          <Button variant="primary" onClick={() => setShowProfileModal(true)}>
            Update Profile
          </Button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="card settings-card">
        <div className="card-body">
          <h5 className="card-title">
            <BiBell className="me-2" /> Notifications
          </h5>
          <Form>
            <Form.Check
              type="switch"
              id="email-notifications"
              label="Email Notifications"
              checked={notifications.email}
              onChange={() => handleNotificationToggle('email')}
            />
            <Form.Check
              type="switch"
              id="push-notifications"
              label="Push Notifications"
              checked={notifications.push}
              onChange={() => handleNotificationToggle('push')}
            />
            <Form.Check
              type="switch"
              id="inapp-notifications"
              label="In-App Notifications"
              checked={notifications.inApp}
              onChange={() => handleNotificationToggle('inApp')}
            />
          </Form>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="card settings-card">
        <div className="card-body">
          <h5 className="card-title">
            <BiLock className="me-2" /> Privacy
          </h5>
          <Form>
            <Form.Check
              type="switch"
              id="share-data"
              label="Share Data with Third Parties"
              checked={privacy.shareData}
              onChange={() => handlePrivacyToggle('shareData')}
            />
            <Form.Check
              type="switch"
              id="public-profile"
              label="Make Profile Public"
              checked={privacy.publicProfile}
              onChange={() => handlePrivacyToggle('publicProfile')}
            />
          </Form>
        </div>
      </div>

      {/* Logout */}
      <div className="card settings-card">
        <div className="card-body">
          <h5 className="card-title">
            <BiLogOut className="me-2" /> Logout
          </h5>
          <Button variant="danger" onClick={handleLogout}>
            Log Out
          </Button>
        </div>
      </div>

      {/* Profile Update Modal */}
      <Modal
        show={showProfileModal}
        onHide={() => setShowProfileModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Update Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleProfileSubmit}>
            <Form.Group className="mb-3" controlId="name">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="profile_image">
              <Form.Label>Profile Image</Form.Label>
              <Form.Control
                type="file"
                name="profile_image"
                accept="image/*"
                onChange={handleProfileChange}
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Settings;