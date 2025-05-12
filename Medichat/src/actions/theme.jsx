export const SET_THEME = 'SET_THEME';

export const setTheme = (theme) => (dispatch) => {
  localStorage.setItem('theme', theme);
  document.body.classList.toggle('dark-mode', theme === 'dark');
  dispatch({
    type: SET_THEME,
    payload: theme,
  });
};