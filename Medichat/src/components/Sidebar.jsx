import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

const Sidebar = ({ onSelect, activeButton }) => {
  const { patient, doctor, isDoctor } = useSelector((state) => state.auth);
  const user = useMemo(() => (isDoctor ? doctor : patient), [isDoctor, doctor, patient]);
  const isPatient = useMemo(() => !isDoctor, [isDoctor]);

  const buttonsConfig = useMemo(() => {
    // Base buttons common to both roles (without Settings)
    const baseCommonButtons = [
      { name: 'chat', icon: 'bi-chat', label: 'Chat', show: true },
      { name: 'news', icon: 'bi-newspaper', label: 'Latest News', show: true },
      { name: 'doctors', icon: 'bi-heart-pulse', label: 'Find a Doctor', show: true },
      { name: 'hospitals', icon: 'bi-hospital', label: 'Hospitals', show: true },
    ];

    // Settings button (added last)
    const settingsButton = { 
      name: 'settings', 
      icon: 'bi-gear', 
      label: 'Settings', 
      show: true 
    };

    // Role-specific buttons
    const patientButtons = [
      { name: 'calls', icon: 'bi-telephone', label: 'Calls', show: isPatient },
      { name: 'mydoctors', icon: 'bi-people-fill', label: 'My Doctors', show: isPatient },
    ];

    const doctorButtons = [
      { name: 'notes', icon: 'bi-file-earmark-text', label: 'Notes', show: !isPatient },
      { name: 'mypatients', icon: 'bi-people-fill', label: 'My Patients', show: !isPatient },
    ];

    // Combine: base buttons + role-specific buttons + settings
    return [
      ...baseCommonButtons,
      ...(isPatient ? patientButtons : doctorButtons),
      settingsButton // Always last
    ];
  }, [isPatient]);

  // Rest of the component remains unchanged
  const handleClick = (buttonName) => {
    onSelect(buttonName);
  };

  const ButtonItem = ({ name, icon, label }) => (
    <div className="pt-2">
      <button
        onClick={() => handleClick(name)}
        className={`btn border-0 d-flex flex-start w-100 ${
          activeButton === name ? 'bg-darker text-white' : ''
        }`}
      >
        <i className={`bi ${icon} linktag main-text-srt`}> {label}</i>
      </button>
    </div>
  );

  return (
    <div className="col-2 Sidebar bg-light d-none d-md-block">
      <div className="row top">
        <div className="justify-content-between">
          {buttonsConfig.map(
            (button) =>
              button.show && (
                <ButtonItem
                  key={button.name}
                  name={button.name}
                  icon={button.icon}
                  label={button.label}
                />
              )
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;