import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import EmojiPicker from 'emoji-picker-react';
import { BiSmile, BiSend, BiPhone, BiVideo, BiDotsVertical } from 'react-icons/bi';
import { Modal, Button } from 'react-bootstrap';
import { connectWebSocket, disconnectWebSocket, sendMessage, getChatMessages } from '../actions/auth';
import { useParams } from 'react-router-dom';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

const Chat = () => {
  const dispatch = useDispatch();
  const { consultationId } = useParams();
  const consultation = useSelector((state) => state.consultations.current);
  const messages = useSelector((state) => state.chat.messages);
  const { user } = useSelector((state) => state.auth);
  const { websocketError, loading, error: chatError } = useSelector((state) => state.chat);
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [error, setError] = useState(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const chatBoxRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    console.log('Chat rendering for user:', user?.is_doctor ? 'Doctor' : 'Patient', 'Messages:', messages);
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, user]);

  // WebSocket and messages setup
  useEffect(() => {
    console.log('Chat useEffect:', { consultationId, consultation });
    if (consultationId) {
      const consultationIdNum = parseInt(consultationId);
      if (consultation?.id && consultation.id === consultationIdNum) {
        console.log('Fetching messages and connecting WebSocket for consultation:', consultation.id);
        dispatch(getChatMessages(consultation.id));
        dispatch(connectWebSocket(consultation.id));
      } else {
        console.log('Consultation not loaded or mismatched:', { consultation, consultationId });
      }

      return () => {
        console.log('Cleaning up WebSocket for consultation:', consultationId);
        dispatch(disconnectWebSocket());
      };
    }
  }, [dispatch, consultation, consultationId]);

  // Call timer
  useEffect(() => {
    let timer;
    if (isCallActive) {
      timer = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCallActive]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const onEmojiClick = (emojiObject) => {
    setInput((prev) => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handleSend = async () => {
    if (input.trim() && consultation?.id) {
      console.log('Attempting to send message:', { consultationId: consultation.id, content: input });
      try {
        setError(null);
        await dispatch(sendMessage(consultation.id, input));
        setInput('');
        console.log('Message sent successfully');
      } catch (error) {
        console.error('Failed to send message:', error.message);
        setError('Failed to send message: ' + error.message);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown Date';
    try {
      const date = parseISO(timestamp);
      if (isNaN(date.getTime())) return 'Invalid Date';
      console.log('formatDate:', {
        timestamp,
        parsedDate: date.toISOString(),
        isToday: isToday(date),
        isYesterday: isYesterday(date),
      });
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error parsing timestamp:', timestamp, error);
      return 'Invalid Date';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'No time';
    try {
      const date = parseISO(timestamp);
      if (isNaN(date.getTime())) return 'Invalid Time';
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Error parsing timestamp for time:', timestamp, error);
      return 'Invalid Time';
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const dateKey = formatDate(msg.timestamp);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(msg);
    return acc;
  }, {});

  // Sort dates (oldest first for bottom-up flow)
  const sortedDates = Object.keys(groupedMessages).sort((a, b) => {
    if (a === 'Today') return 1;
    if (b === 'Today') return -1;
    if (a === 'Yesterday') return 1;
    if (b === 'Yesterday') return -1;
    return new Date(a) - new Date(b);
  });

  console.log('groupedMessages:', groupedMessages);
  console.log('sortedDates:', sortedDates);
  console.log('Redux state:', { messages, loading, chatError, websocketError });

  // Handle phone call actions
  const handlePhoneCall = () => {
    setShowPhoneModal(true);
    setCallTimer(0);
    setIsCallActive(false);
  };

  const handleAcceptCall = () => {
    setIsCallActive(true);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setShowPhoneModal(false);
    setCallTimer(0);
  };

  // Handle video call actions
  const handleVideoCall = () => {
    setShowVideoModal(true);
    setCallTimer(0);
    setIsCallActive(false);
  };

  const handleAcceptVideo = () => {
    setIsCallActive(true);
  };

  const handleEndVideo = () => {
    setIsCallActive(false);
    setShowVideoModal(false);
    setCallTimer(0);
  };

  // Handle settings actions
  const handleSettingsOption = (option) => {
    console.log(`Settings option selected: ${option}`);
    if (option === 'Clear Chat') {
      dispatch(clearChat());
    }
    setShowSettingsModal(false);
  };

  if (!consultation || consultation.id !== parseInt(consultationId)) {
    console.log('Rendering no consultation message');
    return <p>Select a consultation to start chatting.</p>;
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="d-flex align-items-center">
          <img
            className="user-img rounded-circle"
            src={
              user?.is_doctor
                ? consultation.patient?.profile_image || 'assets/img/user2.jpg'
                : consultation.doctor?.profile_image || 'assets/img/user2.jpg'
            }
            alt={user?.is_doctor ? 'Patient' : 'Doctor'}
            onError={(e) => (e.target.src = 'assets/img/user2.jpg')}
          />
          <div className="ms-2">
            <p className="mb-0 text-success fw-bold">
              {user?.is_doctor
                ? consultation.patient?.name || 'Unknown Patient'
                : consultation.doctor?.name || 'Unknown Doctor'}
            </p>
            <p className="small text-muted">Online</p>
          </div>
        </div>
        <div className="action-buttons">
          <button className="action-btn" onClick={handlePhoneCall}>
            <BiPhone size={24} />
          </button>
          <button className="action-btn" onClick={handleVideoCall}>
            <BiVideo size={24} />
          </button>
          <button className="action-btn" onClick={() => setShowSettingsModal(true)}>
            <BiDotsVertical size={24} />
          </button>
        </div>
      </div>
      <div className="chat-box" ref={chatBoxRef}>
        {loading ? (
          <p className="text-center text-muted">Loading messages...</p>
        ) : sortedDates.length > 0 ? (
          sortedDates.map((date) => (
            <div key={date} className="date-group">
              <h6 className="date-divider">{date}</h6>
              {groupedMessages[date]
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                .map((msg) => (
                  <div
                    key={msg.id}
                    className={`message ${msg.sender.id === user?.id ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      {msg.content}
                      <div className="message-timestamp">{formatTime(msg.timestamp)}</div>
                    </div>
                  </div>
                ))}
            </div>
          ))
        ) : (
          <p className="text-center text-muted">No messages yet.</p>
        )}
      </div>
      {/*{(error || chatError || websocketError) && (
        <div className="alert alert-danger text-center py-2">
          {error || chatError || websocketError}
        </div>
      )}*/}
      <div className="status-input-container">
        <div className="input-wrapper">
          <button className="emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            <BiSmile className="emoji-icon" />
          </button>
          <input
            type="text"
            className="status-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type message..."
          />
          <button className="send-btn" onClick={handleSend} disabled={!input.trim()}>
            <BiSend className="send-icon" />
          </button>
        </div>
        {showEmojiPicker && (
          <div className="emoji-picker-container">
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              skinTonesDisabled
              searchDisabled
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}
      </div>

      {/* Phone Call Modal */}
      <Modal
        show={showPhoneModal}
        onHide={handleEndCall}
        centered
        className="call-modal"
        backdrop="static"
      >
        <Modal.Body className="phone-call-screen">
          <h3>{user?.is_doctor ? consultation.patient?.name : consultation.doctor?.name}</h3>
          <p>{isCallActive ? `Call Duration: ${formatTimer(callTimer)}` : 'Outgoing Call...'}</p>
          <div className="call-animation">
            <div className="call-wave"></div>
            <div className="call-wave"></div>
            <div className="call-wave"></div>
          </div>
          <div className="call-buttons">
            {!isCallActive ? (
              <Button variant="danger" onClick={handleEndCall}>
                <i className="bi bi-telephone-x"></i> Cancel Call
              </Button>
            ) : (
              <Button variant="danger" onClick={handleEndCall}>
                End Call
              </Button>
            )}
          </div>
        </Modal.Body>
      </Modal>

      {/* Video Call Modal */}
      <Modal
        show={showVideoModal}
        onHide={handleEndVideo}
        centered
        className="call-modal"
        backdrop="static"
      >
        <Modal.Body className="video-call-screen">
          <h4>Video calling {user?.is_doctor ? consultation.patient?.name : consultation.doctor?.name}</h4>
          <div className="video-feed">
            <div className="remote-feed">
              <p>Remote Video</p>
            </div>
            <div className="self-feed">
              <p>Your Video</p>
            </div>
          </div>
          <p>{isCallActive ? `Call Duration: ${formatTimer(callTimer)}` : 'Connecting...'}</p>
          <div className="call-buttons">
            {!isCallActive ? (
              <>
                <Button variant="success rounded-circle" onClick={handleAcceptVideo}>
                  <i className="bi bi-person-plus"></i>
                </Button>
                <Button variant="danger rounded-circle" onClick={handleEndVideo}>
                  <i className="bi bi-camera-video-off"></i>
                </Button>
                <Button variant="light rounded-circle" onClick={handleEndVideo}>
                  <i className="bi bi-mic-mute"></i>
                </Button>
              </>
            ) : (
              <>
                <Button variant="danger rounded-circle" onClick={handleEndVideo}>
                  <i className="bi bi-camera-video-off"></i>
                </Button>
                <Button variant="secondary rounded-circle" >
                  <i className="bi bi-mic-mute"></i>
                </Button>
              </>
            )}
          </div>
        </Modal.Body>
      </Modal>

      {/* Settings Modal */}
      <Modal
        show={showSettingsModal}
        onHide={() => setShowSettingsModal(false)}
        centered
        className="settings-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Chat Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="settings-option" onClick={() => handleSettingsOption('Mute Notifications')}>
            Mute Notifications
          </div>
          <div className="settings-option" onClick={() => handleSettingsOption('Clear Chat')}>
            Clear Chat
          </div>
          <div className="settings-option" onClick={() => handleSettingsOption('Block User')}>
            Block User
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Chat;