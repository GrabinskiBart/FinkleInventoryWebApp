import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, User, Lock, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  const demoCredentials = [
    { username: 'admin', role: 'Administrator' },
    { username: 'manager', role: 'Manager' },
    { username: 'user', role: 'User' },
    { username: 'guest', role: 'Guest User' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md md:max-w-lg w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 md:h-16 md:w-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
              <LogIn className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-600 text-base md:text-lg mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 md:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-base md:text-lg"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm md:text-base font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 md:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors text-base md:text-lg"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center touch-manipulation"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 md:h-6 md:w-6 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 md:h-6 md:w-6 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm md:text-base">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 md:py-4 px-4 border border-transparent rounded-lg shadow-sm text-sm md:text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm md:text-base font-medium text-gray-700 mb-3">Demo Accounts:</h3>
            <div className="space-y-2">
              {demoCredentials.map((cred) => (
                <div key={cred.username} className="flex justify-between items-center text-sm md:text-base">
                  <span className="font-mono text-gray-600">{cred.username}</span>
                  <span className="text-gray-500">{cred.role}</span>
                </div>
              ))}
            </div>
            <p className="text-xs md:text-sm text-gray-500 italic mt-3">
              All demo accounts use the password: "password"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;