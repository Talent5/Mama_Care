import React, { useState } from 'react';
import { Heart, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e9f8e7' }}>
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full" style={{ backgroundColor: '#4ea674' }}>
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#023337' }}>MamaCare Zimbabwe</h1>
          <p className="text-gray-600 mt-2">Maternal Health Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Use your MamaCare account credentials
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4ea674] focus:border-transparent"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Demo: Use any password
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#4ea674' }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={() => {
              setEmail('admin@mamacare.zw');
              setPassword('Admin123!');
            }}
            className="w-full py-2 px-4 rounded-lg text-[#4ea674] border border-[#4ea674] font-medium transition-colors hover:bg-[#4ea674] hover:text-white"
          >
            Use Demo Credentials
          </button>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-[#4ea674] hover:underline"
            >
              Forgot your password?
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Demo Credentials:
          </p>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p><strong>System Admin:</strong> admin@mamacare.zw / Admin123!</p>
            <p className="text-xs text-orange-600 mt-1">
              Note: Please use the exact credentials above to login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;