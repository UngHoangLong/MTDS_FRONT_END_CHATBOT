import { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, LogIn, AlertCircle, ArrowLeft } from 'lucide-react';
import mtdsLogo from '../assets/logo_MTDS.png';

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function LoginPage({ onLoginSuccess, onCancel }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/admin/login`, {
        username,
        password
      });

      // Lưu token vào localStorage
      localStorage.setItem('authToken', response.data.access_token);
      localStorage.setItem('adminId', response.data.admin_id);
      localStorage.setItem('adminUsername', response.data.username);

      // Gọi callback để thông báo đăng nhập thành công
      onLoginSuccess(response.data);
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Đăng nhập không thành công. Vui lòng kiểm tra tên đăng nhập và mật khẩu.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
            <div className="flex justify-center mb-4">
              <img src={mtdsLogo} alt="MTDS Logo" className="h-12 w-auto" />
            </div>
            <h1 className="text-2xl font-bold text-white text-center">MTDS Chatbot</h1>
            <p className="text-blue-100 text-center mt-2">Đăng nhập Admin</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="px-6 py-8 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Username Input */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Tên đăng nhập
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập admin"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Quay Lại
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Đang...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Đăng nhập
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="bg-blue-50 px-6 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              💡 Chỉ admin có thể truy cập để quản lý tài liệu của chatbot
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
