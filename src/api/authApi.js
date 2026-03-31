import apiClient from './client';

const KEY_PASS = process.env.REACT_APP_KEY_PASS || '07ba959153fe7eec778361bf42079439';

export const login = async (email, password) => {
  // API requires multipart/form-data (not JSON)
  const formData = new FormData();
  formData.append('email', email);
  formData.append('password', password);
  formData.append('key_pass', KEY_PASS);

  const response = await apiClient.post('/login', formData);
  const body = response.data;
  // API returns { data: { data: { token: { token: "eyJ..." }, user: {...} } } }
  const tokenObj = body?.data?.data?.token;
  const token =
    (typeof tokenObj === 'string' ? tokenObj : tokenObj?.token) ||
    body?.data?.data?.access_token ||
    body?.data?.token ||
    body?.token;
  return { ...body, _extractedToken: token };
};

export const logout = async () => {
  try {
    await apiClient.post('/logout');
  } finally {
    localStorage.removeItem('auth_token');
  }
};

export const getProfile = async () => {
  const response = await apiClient.get('/profile');
  return response.data;
};
