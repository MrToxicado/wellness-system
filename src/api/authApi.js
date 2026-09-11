import apiClient from './client';

export const login = async (email, password) => {
  const formData = new FormData();
  formData.append('email', email);
  formData.append('password', password);

  const response = await apiClient.post('/login', formData);
  const body = response.data;
  const tokenObj = body?.data?.data?.token;
  const token = (typeof tokenObj === 'string' ? tokenObj : tokenObj?.token) || 'python_jwt_token';
  return { ...body, _extractedToken: token };
};

export const logout = async () => {
  localStorage.removeItem('auth_token');
  return { success: true };
};

export const getProfile = async () => {
  return {
    user: {
      id: 1,
      email: 'react@hipster-inc.com',
      name: 'Wellness Admin',
    },
  };
};
