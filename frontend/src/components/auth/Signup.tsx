import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useNavigate } from 'react-router-dom';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async () => {
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Simulate API call for signup
      if (email && password) {
        localStorage.setItem('authToken', 'dummy-token');
        navigate('/dashboard');
      } else {
        setError('Please fill in all fields');
      }
    } catch (err) {
      setError('An error occurred during signup');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
          Signup
        </h2>
        {error && (
          <div className="mb-4 text-red-500 text-sm text-center">
            {error}
          </div>
        )}
        <div className="space-y-4">
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
          <Input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button onClick={handleSignup} className="w-full">
            Signup
          </Button>
        </div>
      </Card>
    </div>
  );
}
