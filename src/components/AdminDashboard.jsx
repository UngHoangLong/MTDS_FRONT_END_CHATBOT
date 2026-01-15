// Tạo giao diện admin, các chức năng liên quan khác
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Upload, LogOut, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function AdminDashboard({ onBack, onLogout, authToken }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [message, setMessage] = useState({ type: '', content: '' });

  // Load documents khi component mount hoặc khi authToken thay đổi
  useEffect(() => {
    if (authToken) {
      fetchDocuments();
    }
  }, [authToken]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/documents/`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      setDocuments(response.data.documents || []);
    } catch (error) {
      showMessage('error', 'Lỗi khi tải danh sách tài liệu');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type, content) => {
    setMessage({ type, content });
    setTimeout(() => setMessage({ type: '', content: '' }), 5000);
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !title.trim()) {
      showMessage('error', 'Vui lòng chọn file và nhập tiêu đề');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', title);
    formData.append('summary', summary || 'Không có mô tả');

    try {
      await axios.post(`${API_URL}/documents/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'ngrok-skip-browser-warning': 'true'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      showMessage('success', 'Tài liệu đã được tải lên thành công!');
      setUploadFile(null);
      setTitle('');
      setSummary('');
      setUploadProgress(0);
      fetchDocuments();
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'Lỗi khi tải lên tài liệu');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này không?')) {
      return;
    }

    setDeletingDocId(docId);
    try {
      await axios.delete(`${API_URL}/documents/${docId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });

      showMessage('success', 'Tài liệu đã được xóa thành công!');
      fetchDocuments();
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'Lỗi khi xóa tài liệu');
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleLogout = async () => {
    try {
      // Gọi logout endpoint
      await axios.post(`${API_URL}/auth/admin/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Luôn logout ở client side dù gọi endpoint có lỗi hay không
      onLogout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Quản Lý Tài Liệu Admin</h1>
            <p className="text-blue-100 mt-1">Tải lên, chỉnh sửa và xóa tài liệu cho chatbot</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Quay Lại
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <LogOut className="w-5 h-5" />
              Đăng Xuất
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Message Alert */}
        {message.content && (
          <div className={`flex items-center gap-3 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
              {message.content}
            </p>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Upload className="w-6 h-6 text-blue-600" />
            Tải Lên Tài Liệu Mới
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu Đề Tài Liệu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Hướng dẫn sử dụng sản phẩm"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isUploading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn File PDF <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isUploading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô Tả (Tùy chọn)
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Nhập mô tả ngắn về tài liệu này..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                disabled={isUploading}
              ></textarea>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}

            <button
              type="submit"
              disabled={isUploading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang tải lên... {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Tải Lên Tài Liệu
                </>
              )}
            </button>
          </form>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Danh Sách Tài Liệu ({documents.length})</h2>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Chưa có tài liệu nào. Hãy tải lên tài liệu đầu tiên!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Tiêu Đề</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Mô Tả</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Ngày Tạo</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-700">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-gray-600">{doc.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{doc.name}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm max-w-xs truncate">{doc.summary || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{formatDateTime(doc.created_at)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleDelete(doc.id)}
                            disabled={deletingDocId === doc.id}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg inline-flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingDocId === doc.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
