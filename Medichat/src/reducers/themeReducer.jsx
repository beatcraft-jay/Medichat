import { SET_THEME } from '../actions/theme';

const initialState = {
  theme: localStorage.getItem('theme') || 'light',
};

export default function themeReducer(state = initialState, action) {
  switch (action.type) {
    case SET_THEME:
      return { ...state, theme: action.payload };
    default:
      return state;
  }
}