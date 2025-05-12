import { combineReducers } from 'redux';
import {authReducer} from './authReducer';
import {doctorsListReducer} from './doctorListReducer';
import consultationsReducer from './consultationsReducer';
import chatReducer from './chatReducer';
import statusReducer from './status';
import themeReducer from './themeReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  doctorsList: doctorsListReducer,
  chat: chatReducer,
  consultations: consultationsReducer,
  status: statusReducer,
  theme: themeReducer,
});

export default rootReducer;

