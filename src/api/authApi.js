export const login = async (email, password) => {
  return {
    _extractedToken: 'local_wellness_auth_token_100',
    data: {
      user: {
        id: 1,
        email: email || 'react@hipster-inc.com',
        name: 'Wellness Admin',
      },
    },
  };
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
