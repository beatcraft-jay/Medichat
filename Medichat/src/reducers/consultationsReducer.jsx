import {
  GET_CONSULTATIONS_REQUEST,
  GET_CONSULTATIONS_SUCCESS,
  GET_CONSULTATIONS_FAIL,
  SET_CURRENT_CONSULTATION,
  CREATE_CONSULTATION_REQUEST,
  CREATE_CONSULTATION_SUCCESS,
  CREATE_CONSULTATION_FAIL,
  MARK_MESSAGES_AS_READ_SUCCESS,
  MARK_MESSAGES_AS_READ_FAIL,
  UPDATE_UNREAD_COUNT,
} from "../actions/types";

const initialState = {
  data: {
    count: 0,
    next: null,
    previous: null,
    results: [],
  },
  current: null,
  loading: false,
  error: null,
};

export default function consultationsReducer(state = initialState, action) {
  switch (action.type) {
    case GET_CONSULTATIONS_REQUEST:
      return { ...state, loading: true, error: null };

    case GET_CONSULTATIONS_SUCCESS:
      return {
        ...state,
        data: action.payload,
        loading: false,
      };

    case GET_CONSULTATIONS_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload || "Failed to fetch consultations",
      };

    case SET_CURRENT_CONSULTATION:
      return {
        ...state,
        current: state.data.results.find((c) => c.id === action.payload) || null,
      };

    case CREATE_CONSULTATION_REQUEST:
      return { ...state, loading: true, error: null };

    case CREATE_CONSULTATION_SUCCESS:
      return {
        ...state,
        loading: false,
        data: {
          ...state.data,
          count: state.data.count + 1, 
          results: [action.payload, ...state.data.results], 
        },
      };

    case CREATE_CONSULTATION_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload || "Failed to create consultation",
      };

      case MARK_MESSAGES_AS_READ_SUCCESS:
      case UPDATE_UNREAD_COUNT:
        return {
          ...state,
          data: state.data
            ? {
                ...state.data,
                results: state.data.results.map((consultation) =>
                  consultation.id === action.payload.consultationId
                    ? { ...consultation, unread_count: 0 }
                    : consultation
                ),
              }
            : state.data,
        };
      case MARK_MESSAGES_AS_READ_FAIL:
        return {
          ...state,
          error: action.payload,
        };

    default:
      return state;
  }
}