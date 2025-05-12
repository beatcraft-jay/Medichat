// src/reducers/chatReducer.jsx
import {
  CLEAR_CHAT,
  GET_CHAT_MESSAGES_REQUEST,
  GET_CHAT_MESSAGES_SUCCESS,
  GET_CHAT_MESSAGES_FAIL,
  SEND_MESSAGE_REQUEST,
  SEND_MESSAGE_SUCCESS,
  SEND_MESSAGE_FAIL,
  NEW_MESSAGE,
  WS_CONNECT_SUCCESS,
  WS_CONNECT_FAIL,
  WS_DISCONNECT,
  UPDATE_UNREAD_COUNT,
} from '../actions/types';

const initialState = {
  connected: false,
  messages: [],
  loading: false,
  error: null,
  websocketError: null,
  sending: false,
  lastSentContent: null,
};

export default function chatReducer(state = initialState, action) {
  switch (action.type) {
    case CLEAR_CHAT:
      console.log('CLEAR_CHAT: Resetting chat state');
      return initialState;

    case GET_CHAT_MESSAGES_REQUEST:
      console.log('GET_CHAT_MESSAGES_REQUEST: Setting loading state');
      return { ...state, loading: true, error: null, websocketError: null };

    case GET_CHAT_MESSAGES_SUCCESS:
      console.log('GET_CHAT_MESSAGES_SUCCESS Payload:', action.payload);
      const messages = Array.isArray(action.payload)
        ? action.payload
        : action.payload.results || [];
      console.log('GET_CHAT_MESSAGES_SUCCESS Messages:', messages);
      return {
        ...state,
        messages: messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
        loading: false,
        error: null,
        websocketError: null,
      };

    case GET_CHAT_MESSAGES_FAIL:
      console.error('GET_CHAT_MESSAGES_FAIL:', action.payload);
      return {
        ...state,
        loading: false,
        error: action.payload || 'Failed to fetch messages',
        websocketError: null,
      };

    case SEND_MESSAGE_REQUEST:
      console.log('SEND_MESSAGE_REQUEST:', action.payload);
      return {
        ...state,
        sending: true,
        lastSentContent: action.payload?.content,
        error: null,
        websocketError: null,
      };

    case SEND_MESSAGE_SUCCESS:
      console.log('SEND_MESSAGE_SUCCESS');
      return { ...state, sending: false, error: null };

    case SEND_MESSAGE_FAIL:
      console.error('SEND_MESSAGE_FAIL:', action.payload);
      return {
        ...state,
        sending: false,
        error: action.payload || 'Message send failed',
        lastSentContent: null,
      };

    case NEW_MESSAGE:
      console.log('NEW_MESSAGE Payload:', action.payload);
      if (action.payload && action.payload.content && action.payload.id) {
        if (state.messages.some((msg) => msg.id === action.payload.id)) {
          console.log('Duplicate message ignored:', action.payload.id);
          return state;
        }
        const isSender = state.lastSentContent === action.payload.content;
        const newMessages = [...state.messages, action.payload].sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        console.log('NEW_MESSAGE Updated messages:', newMessages);
        return {
          ...state,
          messages: newMessages,
          lastSentContent: isSender ? null : state.lastSentContent,
          error: null,
          websocketError: null,
        };
      }
      console.warn('Invalid NEW_MESSAGE payload:', action.payload);
      return state;

    case WS_CONNECT_SUCCESS:
      console.log('WS_CONNECT_SUCCESS: WebSocket connected');
      return {
        ...state,
        connected: true,
        websocketError: null,
      };

    case WS_CONNECT_FAIL:
      console.error('WS_CONNECT_FAIL:', action.payload);
      return {
        ...state,
        connected: false,
        websocketError: action.payload || 'WebSocket connection failed',
      };

    case WS_DISCONNECT:
      console.log('WS_DISCONNECT');
      return {
        ...state,
        connected: false,
        websocketError: null,
      };

    case UPDATE_UNREAD_COUNT:
      console.log('UPDATE_UNREAD_COUNT:', action.payload);
      return state;

    default:
      return state;
  }
}