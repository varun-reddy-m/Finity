import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useNavigate } from 'react-router-dom';
import { registerUser, loginUser } from '../../utils/apiClient';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError('');
    try {
      if (isSignup) {
        await registerUser(email, password, fullName);
        alert('Signup successful! Please log in.');
        setIsSignup(false);
      } else {
        const token = await loginUser(email, password);
        localStorage.setItem('authToken', token);
        onLogin(); // Update authentication state
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
          {isSignup ? 'Signup' : 'Login'}
        </h2>
        {error && (
          <div className="mb-4 text-red-500 text-sm text-center">
            {error}
          </div>
        )}
        <div className="space-y-4">
          {isSignup && (
            <Input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button onClick={handleSubmit} className="w-full">
            {isSignup ? 'Signup' : 'Login'}
          </Button>
          <div className="text-center">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-sm text-blue-500 hover:underline"
            >
              {isSignup ? 'Already have an account? Login' : "Don't have an account? Signup"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
