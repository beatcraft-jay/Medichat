import {
    DOCTOR_USER_LOADED,
    DOCTOR_USER_FAILED,
    PATIENT_USER_LOADED,
    PATIENT_USER_FAILED,
    LOGIN_SUCCESS,
    LOGIN_FAILED,
    LOGOUT_SUCCESS,
    REGISTER_DOCTOR_USER_SUCCESS,
    REGISTER_PATIENT_USER_FAILED,
    REGISTER_PATIENT_USER_SUCCESS,
    REGISTER_DOCTOR_USER_FAILED,
    UPDATE_PATIENT_USER_SUCCESS,
    UPDATE_DOCTOR_USER_SUCCESS,
    UPDATE_DOCTOR_USER_FAILED,
    DOCTORS_LIST_REQUEST,
    DOCTORS_LIST_SUCCESS,
    DOCTORS_LIST_FAIL,
  } from "../actions/types";
  
  const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    isDoctor: null,
    isLoading: false,
    user: null,
    patient: null,
    doctor: null, // Added for consistency
    error: null, // Added to store errors
  };
  
  export const authReducer = (state = initialState, action) => {
    switch (action.type) {
      case 'SET_AUTH_TOKEN':
        return {
          ...state,
          token: action.payload,
          isLoading: true,
          error: null,
        };
  
      case 'BASE_USER_LOADED': // Updated to match setAuthToken
        return {
          ...state,
          user: action.payload,
          isAuthenticated: true,
          isLoading: false,
          isDoctor: action.payload.is_doctor,
          error: null,
        };
  
      case 'AUTH_SUCCESS':
        return {
          ...state,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        };
  
      case 'AUTH_FAIL':
        localStorage.removeItem('token');
        return {
          ...state,
          token: null,
          user: null,
          isAuthenticated: false,
          isDoctor: null,
          isLoading: false,
          patient: null,
          doctor: null,
          error: action.payload || 'Authentication failed',
        };
  
      case REGISTER_DOCTOR_USER_SUCCESS:
        localStorage.setItem('token', action.payload.token);
        return {
          ...state,
          token: action.payload.token,
          isAuthenticated: true,
          isDoctor: true,
          isLoading: false,
          user: action.payload.user,
          doctor: action.payload.doctor,
          error: null,
        };
  
      case REGISTER_PATIENT_USER_SUCCESS:
        localStorage.setItem('token', action.payload.token);
        return {
          ...state,
          token: action.payload.token,
          isAuthenticated: true,
          isDoctor: false,
          isLoading: false,
          user: action.payload.user,
          patient: action.payload.patient, // Fixed: Use patient from payload
          error: null,
        };
  
      case DOCTOR_USER_LOADED:
        return {
          ...state,
          isAuthenticated: true,
          isLoading: false,
          isDoctor: true,
          doctor: action.payload,
          error: null,
        };
  
      case PATIENT_USER_LOADED:
        return {
          ...state,
          isAuthenticated: true,
          isLoading: false,
          isDoctor: false,
          patient: action.payload,
          error: null,
        };
  
      case UPDATE_DOCTOR_USER_SUCCESS:
        return {
          ...state,
          doctor: action.payload,
          isLoading: false,
          error: null,
        };
  
      case UPDATE_PATIENT_USER_SUCCESS:
        return {
          ...state,
          patient: action.payload,
          isLoading: false,
          error: null,
        };
  
      case LOGIN_SUCCESS:
        localStorage.setItem('token', action.payload.token);
        return {
          ...state,
          token: action.payload.token,
          isAuthenticated: true,
          isLoading: false,
          isDoctor: action.payload.user.is_doctor,
          user: action.payload.user,
          patient: action.payload.patient,
          doctor: action.payload.doctor, // Added for consistency
          error: null,
        };
  
      case REGISTER_DOCTOR_USER_FAILED:
      case REGISTER_PATIENT_USER_FAILED:
      case LOGIN_FAILED:
        localStorage.removeItem('token');
        return {
          ...state,
          token: null,
          isDoctor: null,
          isAuthenticated: false,
          isLoading: false,
          user: null,
          patient: null,
          doctor: null,
          error: action.payload || 'Operation failed',
        };
  
      case DOCTOR_USER_FAILED:
      case PATIENT_USER_FAILED:
      case LOGOUT_SUCCESS:
        localStorage.removeItem('token');
        return {
          ...state,
          token: null,
          isDoctor: null,
          isAuthenticated: false,
          isLoading: false,
          user: null,
          patient: null,
          doctor: null,
          error: null,
        };
  
      default:
        return state;
    }
  };