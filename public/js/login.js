/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const signUp = async (username, email, password, passwordConfirm) => {
  try{
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name: username,
        email: email, 
        password: password,
        passwordConfirm: passwordConfirm
      }
    })

    if (res.data.status === 'success'){
      showAlert('success', 'Signed Up in successfully! Please check your email');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  }catch(err){
    showAlert('error', err.response.data.message);
    location.assign('/');
  }
}

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password
      }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout'
    });
    if ((res.data.status = 'success')) location.assign('/');
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out! Try again.');
  }
};
