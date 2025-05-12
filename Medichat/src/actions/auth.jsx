import axios from "axios";
import {
  DOCTOR_USER_LOADED,
  DOCTOR_USER_FAILED,
  PATIENT_USER_LOADED,
  PATIENT_USER_FAILED,
  LOGIN_FAILED,
  LOGIN_SUCCESS,
  LOGOUT_SUCCESS,
  REGISTER_DOCTOR_USER_SUCCESS,
  REGISTER_PATIENT_USER_FAILED,
  REGISTER_PATIENT_USER_SUCCESS,
  REGISTER_DOCTOR_USER_FAILED,
  UPDATE_PATIENT_USER_SUCCESS,
  UPDATE_PATIENT_USER_FAILED,
  UPDATE_DOCTOR_USER_FAILED,
  UPDATE_DOCTOR_USER_SUCCESS,
  WS_CONNECT,
  WS_DISCONNECT,
  NEW_MESSAGE,
  GET_CHAT_MESSAGES_SUCCESS,
  WS_CONNECT_SUCCESS,
  WS_CONNECT_FAIL,
  GET_CHAT_MESSAGES_FAIL,
  SEND_MESSAGE_SUCCESS,
  SEND_MESSAGE_FAIL,
  GET_CONSULTATIONS_REQUEST,
  GET_CONSULTATIONS_SUCCESS,
  GET_CONSULTATIONS_FAIL,
  SET_CURRENT_CONSULTATION,
  CLEAR_CHAT,
  GET_STATUSES_REQUEST,
  GET_STATUSES_SUCCESS,
  GET_STATUSES_FAIL,
  CREATE_STATUS_REQUEST,
  CREATE_STATUS_SUCCESS,
  CREATE_STATUS_FAIL,
  CREATE_CONSULTATION_REQUEST,
  CREATE_CONSULTATION_SUCCESS,
  CREATE_CONSULTATION_FAIL,
  SEND_MESSAGE_REQUEST,
  MARK_MESSAGES_AS_READ_SUCCESS,
  MARK_MESSAGES_AS_READ_FAIL,
  GET_CHAT_MESSAGES_REQUEST,
} from "./types";

const API_BASE = "http://127.0.0.1:8000/api";

export const createConsultation = (doctorId) => async (dispatch, getState) => {
  try {
    dispatch({ type: CREATE_CONSULTATION_REQUEST });

    const {
      auth: { token, user },
    } = getState();

    if (!token || !user || !user.id) {
      throw new Error("User not authenticated. Please log in.");
    }

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    };

    const { data } = await axios.post(
      `${API_BASE}/consultations/`,
      { doctor_id: doctorId, patient_id: user.id },
      config
    );

    dispatch({
      type: CREATE_CONSULTATION_SUCCESS,
      payload: data,
    });

    return data;
  } catch (error) {
    const errorMessage = error.response?.data?.detail || error.message || "Failed to create consultation";
    dispatch({
      type: CREATE_CONSULTATION_FAIL,
      payload: errorMessage,
    });
    throw new Error(errorMessage);
  }
};

export const setCurrentConsultation = (consultation) => (dispatch) => {
  dispatch({
    type: SET_CURRENT_CONSULTATION,
    payload: consultation,
  });
};

export const setAuthToken = (token) => async (dispatch) => {
  try {
    const userRes = await axios.get(`${API_BASE}/users/me/`, {
      headers: { Authorization: `Token ${token}` },
    });

    dispatch({ type: 'BASE_USER_LOADED', payload: userRes.data });

    if (userRes.data.is_doctor) {
      await dispatch(getDoctorUser());
    } else if (userRes.data.is_patient) {
      await dispatch(getPatientUser());
    }

    dispatch({ type: 'AUTH_SUCCESS' });
  } catch (error) {
    console.error("Auth validation failed:", error);
    localStorage.removeItem('token');
    dispatch({ type: 'AUTH_FAIL', payload: error.response?.data?.detail || 'Token validation failed' });
  }
};


const fetchUserProfile = (endpoint, successType, failType) => async (dispatch, getState) => {
  try {
    const res = await axios.get(`${API_BASE}${endpoint}`, {
      headers: { Authorization: `Token ${getState().auth.token}` },
    });
    dispatch({ type: successType, payload: res.data });
  } catch (error) {
    console.error("API Error:", error.response?.data);
    dispatch({ type: failType });
  }
};
export const getDoctorUser = () => fetchUserProfile("/doctors/me/", DOCTOR_USER_LOADED, DOCTOR_USER_FAILED);
export const getPatientUser = () => fetchUserProfile("/patients/me/", PATIENT_USER_LOADED, PATIENT_USER_FAILED);

// User registration
export const create_doctoruser = (formData) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_BASE}/signup/doctor/`, formData, {
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      withCredentials: false,
    });

    if (res.data.token) {
      axios.defaults.headers.common["Authorization"] = `Token ${res.data.token}`;
    }

    dispatch({ type: REGISTER_DOCTOR_USER_SUCCESS, payload: res.data });
  } catch (err) {
    handleRegistrationError(err, dispatch, REGISTER_DOCTOR_USER_FAILED);
  }
};

export const create_patientuser = (formData) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_BASE}/signup/patient/`, formData, {
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      withCredentials: false,
    });

    if (res.data.token) {
      axios.defaults.headers.common["Authorization"] = `Token ${res.data.token}`;
    }

    dispatch({ type: REGISTER_PATIENT_USER_SUCCESS, payload: res.data });
  } catch (err) {
    handleRegistrationError(err, dispatch, REGISTER_PATIENT_USER_FAILED);
  }
};

// Profile updates
const updateProfile = (endpoint, formData, successType, failType) => async (dispatch, getState) => {
  const token = getState().auth.token;
  if (!token) {
    dispatch({ type: LOGOUT_SUCCESS });
    return Promise.reject("Session expired");
  }

  try {
    const res = await axios.put(`${API_BASE}${endpoint}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Token ${token}`,
      },
    });
    dispatch({ type: successType, payload: res.data });
    return res.data;
  } catch (err) {
    console.error("API Error:", err.response?.data);
    dispatch({ type: failType, payload: err.response?.data || "Update failed" });
    throw err;
  }
};

export const update_doctoruser = (formData) =>
  updateProfile("/doctors/me/", formData, UPDATE_DOCTOR_USER_SUCCESS, UPDATE_DOCTOR_USER_FAILED);

export const update_patientuser = (formData) =>
  updateProfile("/patients/me/", formData, UPDATE_PATIENT_USER_SUCCESS, UPDATE_PATIENT_USER_FAILED);

// Consultations
export const getConsultations = () => async (dispatch, getState) => {
  try {
    const response = await axios.get(`${API_BASE}/consultations/`, {
      headers: { Authorization: `Token ${getState().auth.token}` },
    });

    dispatch({
      type: GET_CONSULTATIONS_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: GET_CONSULTATIONS_FAIL,
      payload: error.response?.data?.detail || "Failed to load consultations",
    });
  }
};

export const getChatMessages = (consultationId) => async (dispatch, getState) => {
  try {
    console.log('getChatMessages: Fetching messages for consultationId:', consultationId);
    dispatch({ type: GET_CHAT_MESSAGES_REQUEST });

    const token = getState().auth.token;
    if (!token) {
      throw new Error('No auth token');
    }

    let allMessages = [];
    let nextUrl = `${API_BASE}/consultations/${consultationId}/messages/`;
    const config = {
      headers: { Authorization: `Token ${token}` },
    };

    while (nextUrl) {
      console.log('getChatMessages: Fetching URL:', nextUrl);
      const response = await axios.get(nextUrl, config);
      console.log('getChatMessages: API response:', response.data);
      const messages = response.data.results || response.data;
      if (!Array.isArray(messages)) {
        console.error('getChatMessages: Expected array, got:', response.data);
        throw new Error('Invalid response format from server');
      }
      allMessages = [...allMessages, ...messages];
      nextUrl = response.data.next;
    }

    console.log('getChatMessages: Total messages fetched:', allMessages.length, allMessages);
    dispatch({
      type: GET_CHAT_MESSAGES_SUCCESS,
      payload: allMessages,
    });
  } catch (error) {
    console.error('getChatMessages: Error:', error.response?.data || error.message);
    dispatch({
      type: GET_CHAT_MESSAGES_FAIL,
      payload: error.response?.data?.detail || error.message || 'Failed to fetch chat messages',
    });
    throw error;
  }
};

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 3000;

export const connectWebSocket = (consultationId) => async (dispatch, getState) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log("connectWebSocket: Closing existing WebSocket");
    socket.close(1000, "New connection initiated");
    socket = null;
  }

  const token = getState().auth.token;
  if (!token) {
    console.error("connectWebSocket: No auth token");
    dispatch({ type: WS_CONNECT_FAIL, payload: "No auth token" });
    return null;
  }

  try {
    console.log('connectWebSocket: Validating token');
    await axios.get(`${API_BASE}/users/me/`, {
      headers: { Authorization: `Token ${token}` },
    });
  } catch (error) {
    console.error("connectWebSocket: Invalid token:", error.response?.data || error.message);
    dispatch({ type: WS_CONNECT_FAIL, payload: "Invalid auth token" });
    return null;
  }

  const wsUrl = `ws://127.0.0.1:8000/ws/consultations/${consultationId}/?token=${token}`;
  console.log("connectWebSocket: Connecting to:", wsUrl);
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log("connectWebSocket: WebSocket connected for consultation:", consultationId);
    dispatch({ type: WS_CONNECT_SUCCESS });
    reconnectAttempts = 0;
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("connectWebSocket: WebSocket message received:", data);
      if (data.type === "new_message" && data.message?.content && data.message?.id) {
        console.log("connectWebSocket: Dispatching NEW_MESSAGE:", data.message);
        dispatch({ type: NEW_MESSAGE, payload: data.message });
        dispatch({
          type: UPDATE_UNREAD_COUNT,
          payload: {
            consultationId: parseInt(consultationId),
            unread_count: data.unread_count || 0,
          },
        });
      } else if (data.type === "unread_count_update") {
        console.log("connectWebSocket: Dispatching UPDATE_UNREAD_COUNT:", data);
        dispatch({
          type: UPDATE_UNREAD_COUNT,
          payload: {
            consultationId: parseInt(data.consultation_id),
            unread_count: data.unread_count || 0,
          },
        });
      } else if (data.type === "ping") {
        // Handle ping message to keep connection alive
        console.log("connectWebSocket: Received ping, sending pong");
        socket.send(JSON.stringify({ type: "pong" }));
      } else if (data.error) {
        console.error("connectWebSocket: Backend error:", data.error);
        dispatch({ type: SEND_MESSAGE_FAIL, payload: data.error });
        if (data.error.includes("Consultation") || data.error.includes("token")) {
          dispatch(disconnectWebSocket());
        }
      } else {
        console.warn("connectWebSocket: Unexpected message format:", data);
      }
    } catch (error) {
      console.error("connectWebSocket: Failed to parse WebSocket message:", error);
    }
  };

  socket.onclose = (event) => {
    console.log("connectWebSocket: WebSocket disconnected:", {
      code: event.code,
      reason: event.reason,
      state: socket?.readyState,
    });
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS && event.code !== 1000) {
      reconnectAttempts++;
      const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
      console.log(`connectWebSocket: Reconnecting, attempt ${reconnectAttempts} after ${delay}ms`);
      setTimeout(() => dispatch(connectWebSocket(consultationId)), delay);
    } else {
      console.error("connectWebSocket: Max reconnect attempts reached or normal closure");
      dispatch({
        type: WS_CONNECT_FAIL,
        payload: event.reason || `WebSocket closed with code ${event.code}`,
      });
    }
  };

  socket.onerror = (error) => {
    console.error("connectWebSocket: WebSocket error:", error);
    dispatch({ type: WS_CONNECT_FAIL, payload: "WebSocket connection failed" });
  };

  return socket;
};

export const disconnectWebSocket = () => (dispatch) => {
  if (socket) {
    console.log("Closing WebSocket, state:", socket.readyState);
    socket.close(1000, "Normal closure");
    socket = null;
    dispatch({ type: WS_DISCONNECT });
  }
};

export const sendMessage = (consultationId, content) => async (dispatch, getState) => {
  console.log("sendMessage called:", {
    consultationId,
    content,
    socketState: socket?.readyState,
  });
  const token = getState().auth.token;

  // Validate token
  try {
    await axios.get(`${API_BASE}/users/me/`, {
      headers: { Authorization: `Token ${token}` },
    });
  } catch (error) {
    console.error("Invalid token:", error);
    dispatch({ type: SEND_MESSAGE_FAIL, payload: "Invalid auth token" });
    return Promise.reject(new Error("Invalid auth token"));
  }

  if (!socket) {
    console.error("WebSocket not initialized");
    dispatch({ type: SEND_MESSAGE_FAIL, payload: "WebSocket not initialized" });
    return Promise.reject(new Error("WebSocket not initialized"));
  }

  if (socket.readyState !== WebSocket.OPEN) {
    console.error("WebSocket not open, state:", socket.readyState);
    try {
      console.log("Attempting to reconnect WebSocket...");
      await dispatch(connectWebSocket(consultationId));
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Reconnect timeout")), 5000);
        socket.onopen = () => {
          clearTimeout(timeout);
          resolve();
        };
        socket.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Reconnect failed"));
        };
      });
    } catch (error) {
      console.error("Reconnect failed:", error);
      dispatch({ type: SEND_MESSAGE_FAIL, payload: "WebSocket reconnect failed" });
      return Promise.reject(error);
    }
  }

  if (socket.readyState === WebSocket.OPEN) {
    try {
      dispatch({ type: SEND_MESSAGE_REQUEST, payload: { content } });
      const messageData = { type: "message", content, consultation_id: consultationId };
      console.log("Sending WebSocket message:", messageData);
      socket.send(JSON.stringify(messageData));
      console.log("Message sent, WebSocket state:", socket.readyState);
      setTimeout(() => console.log("WebSocket state after 1s:", socket.readyState), 1000);
      dispatch({ type: SEND_MESSAGE_SUCCESS });
      return Promise.resolve();
    } catch (error) {
      console.error("Failed to send WebSocket message:", error);
      dispatch({ type: SEND_MESSAGE_FAIL, payload: error.message || "Failed to send message" });
      return Promise.reject(error);
    }
  } else {
    console.error("WebSocket still not connected:", socket.readyState);
    dispatch({ type: SEND_MESSAGE_FAIL, payload: "WebSocket not connected" });
    return Promise.reject(new Error("WebSocket not connected"));
  }
};

export const logout = () => async (dispatch) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found in localStorage");
    }
    await axios.post(`${API_BASE}/logout/`, null, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    });
    dispatch(disconnectWebSocket());
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    dispatch({ type: LOGOUT_SUCCESS });
  } catch (error) {
    console.error("Logout failed:", error.response?.data || error.message);
  }
};

// Helper functions
const handleRegistrationResponse = (res, dispatch, successType) => {
  if (!res.data?.token) throw new Error("Invalid server response");

  localStorage.setItem("token", res.data.token);
  axios.defaults.headers.common["Authorization"] = `Token ${res.data.token}`;

  dispatch({
    type: successType,
    payload: {
      token: res.data.token,
      user: res.data.user,
      ...(res.data.doctor && { doctor: res.data.doctor }),
      ...(res.data.patient && { patient: res.data.patient }),
    },
  });
};

const handleRegistrationError = (err, dispatch, failType) => {
  console.error("Registration error:", err.response?.data || err.message);
  dispatch({ type: failType });
  throw err;
};

// Authentication
export const login = ({ username, password }) => async (dispatch) => {
  try {
    const res = await axios.post(`${API_BASE}/login/`, { username, password });
    if (!res.data.token) throw new Error("No token received");

    localStorage.setItem("token", res.data.token);
    axios.defaults.headers.common["Authorization"] = `Token ${res.data.token}`;
    dispatch({ type: LOGIN_SUCCESS, payload: res.data });
  } catch (error) {
    console.error("Login failed:", error.response?.data || error.message);
    dispatch({ type: LOGIN_FAILED });
  }
};




export const getStatuses = () => async (dispatch, getState) => {
  try {
    dispatch({ type: GET_STATUSES_REQUEST });
    const response = await axios.get(`${API_BASE}/status/`, {
      headers: { Authorization: `Token ${getState().auth.token}` },
    });
    dispatch({
      type: GET_STATUSES_SUCCESS,
      payload: response.data.results || response.data,
    });
  } catch (error) {
    dispatch({
      type: GET_STATUSES_FAIL,
      payload: error.response?.data?.detail || "Error loading statuses",
    });
  }
};

export const createStatus = (formData) => async (dispatch, getState) => {
  try {
    dispatch({ type: CREATE_STATUS_REQUEST });
    const data = new FormData();
    data.append("status_type", formData.status_type);
    if (formData.status_type === "text") {
      data.append("status_text", formData.status_text);
      data.append("background_color", formData.background_color);
    } else if (formData.status_type === "image") {
      data.append("caption", formData.caption);
      data.append("status_image", formData.status_image);
    } else if (formData.status_type === "video") {
      data.append("caption", formData.caption);
      data.append("status_video", formData.status_video);
    }
    const response = await axios.post(`${API_BASE}/status/`, data, {
      headers: {
        Authorization: `Token ${getState().auth.token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    dispatch({
      type: CREATE_STATUS_SUCCESS,
      payload: response.data,
    });
    return response.data;
  } catch (error) {
    dispatch({
      type: CREATE_STATUS_FAIL,
      payload: error.response?.data || { detail: "Failed to create status" },
    });
    throw error;
  }
};

export const updateDoctor = (userData) => async (dispatch) => {
  try {
    const res = await axios.patch(`${API_BASE}/users/doctor/`, userData);
    dispatch({
      type: UPDATE_DOCTOR_USER_SUCCESS,
      payload: res.data,
    });
  } catch (error) {
    dispatch({
      type: UPDATE_DOCTOR_USER_FAILED,
      payload: error.response?.data || 'Doctor update failed',
    });
  }
};

export const updatePatient = (userData) => async (dispatch) => {
  try {
    const res = await axios.patch(`${API_BASE}/users/patient/`, userData);
    dispatch({
      type: UPDATE_PATIENT_USER_SUCCESS,
      payload: res.data,
    });
  } catch (error) {
    dispatch({
      type: UPDATE_PATIENT_USER_FAILED,
      payload: error.response?.data || 'Patient update failed',
    });
  }
};

export const markMessagesAsRead = (consultationId) => async (dispatch, getState) => {
  try {
    const token = getState().auth.token;
    if (!token) {
      throw new Error("No auth token");
    }

    const config = {
      headers: {
        Authorization: `Token ${token}`,
      },
    };

    // API call to mark messages as read
    await axios.post(`${API_BASE}/consultations/${consultationId}/mark-read/`, {}, config);

    // Refresh consultations to update unread_count
    dispatch(getConsultations());

    dispatch({
      type: MARK_MESSAGES_AS_READ_SUCCESS,
      payload: { consultationId },
    });
  } catch (error) {
    console.error('Error marking messages as read:', error.response?.data || error.message);
    dispatch({
      type: MARK_MESSAGES_AS_READ_FAIL,
      payload: error.response?.data?.detail || 'Failed to mark messages as read',
    });
  }
};