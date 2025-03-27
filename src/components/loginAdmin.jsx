import React, { useState } from 'react';

const LoginAdmin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://nukesul-boood-2ab7.twc1.net/api/admin/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        }),
        credentials: 'include' // Если нужны куки для сессии
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      console.log('Login successful:', data);
      // Здесь можно добавить редирект или обработку успешного логина
    } catch (err) {
      console.error('Error during login:', err);
      setError('Failed to login. Please check your credentials.');
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <div>
        <label>Username:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
};

export default LoginAdmin;