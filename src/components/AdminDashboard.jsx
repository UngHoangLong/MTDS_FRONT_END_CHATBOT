// Tạo giao diện admin, các chức năng liên quan khác
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Upload, LogOut, Loader2, AlertCircle, CheckCircle, ArrowLeft, Edit, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function AdminDashboard({ onBack, onLogout, authToken }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);
  const [title, setTitle] = useState("");
  
  // State cho các trường mô tả mới
  const [docPurpose, setDocPurpose] = useState("");
  const [docType, setDocType] = useState("");
  const [docModules, setDocModules] = useState("");
  const [docFunctions, setDocFunctions] = useState("");
  const [docFunctionDetails, setDocFunctionDetails] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [message, setMessage] = useState({ type: '', content: '' });

  // State cho modal cập nhật
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editDocPurpose, setEditDocPurpose] = useState("");
  const [editDocType, setEditDocType] = useState("");
  const [editDocModules, setEditDocModules] = useState("");
  const [editDocFunctions, setEditDocFunctions] = useState("");
  const [editDocFunctionDetails, setEditDocFunctionDetails] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

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
    
    // Kết hợp các trường thành một summary có cấu trúc
    const summaryParts = [];
    if (docType) summaryParts.push(`Tài liệu này nói về gì: ${docType}`);
    if (docPurpose) summaryParts.push(`Mục đích tài liệu: ${docPurpose}`);
    if (docModules) summaryParts.push(`Module/Phân hệ chính: ${docModules}`);
    if (docFunctions) summaryParts.push(`Các chức năng chính: ${docFunctions}`);
    if (docFunctionDetails) summaryParts.push(`Chi tiết chức năng: ${docFunctionDetails}`);
    
    const combinedSummary = summaryParts.length > 0 ? summaryParts.join(' | ') : 'Không có mô tả';
    formData.append('summary', combinedSummary);

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
      // Reset form
      setUploadFile(null);
      setTitle('');
      setDocPurpose('');
      setDocType('');
      setDocModules('');
      setDocFunctions('');
      setDocFunctionDetails('');
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
      await axios.post(`${API_URL}/auth/admin/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      onLogout();
    }
  };

  // Hàm parse summary từ cấu trúc có sẵn
  const parseSummary = (summary) => {
    if (!summary) return {};
    
    const parts = summary.split(' | ');
    const result = {};
    
    parts.forEach(part => {
      if (part.includes('Tài liệu này nói về gì:')) {
        result.docType = part.replace('Tài liệu này nói về gì:', '').trim();
      } else if (part.includes('Mục đích tài liệu:')) {
        result.docPurpose = part.replace('Mục đích tài liệu:', '').trim();
      } else if (part.includes('Module/Phân hệ chính:')) {
        result.docModules = part.replace('Module/Phân hệ chính:', '').trim();
      } else if (part.includes('Các chức năng chính:')) {
        result.docFunctions = part.replace('Các chức năng chính:', '').trim();
      } else if (part.includes('Chi tiết chức năng:')) {
        result.docFunctionDetails = part.replace('Chi tiết chức năng:', '').trim();
      }
    });
    
    return result;
  };

  // Mở modal cập nhật
  const handleOpenEditModal = (doc) => {
    setEditingDoc(doc);
    const parsed = parseSummary(doc.summary);
    setEditDocType(parsed.docType || '');
    setEditDocPurpose(parsed.docPurpose || '');
    setEditDocModules(parsed.docModules || '');
    setEditDocFunctions(parsed.docFunctions || '');
    setEditDocFunctionDetails(parsed.docFunctionDetails || '');
    setIsEditModalOpen(true);
  };

  // Đóng modal cập nhật
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingDoc(null);
    setEditDocType('');
    setEditDocPurpose('');
    setEditDocModules('');
    setEditDocFunctions('');
    setEditDocFunctionDetails('');
  };

  // Xử lý cập nhật summary
  const handleUpdateSummary = async (e) => {
    e.preventDefault();
    
    setIsUpdating(true);
    
    // Kết hợp các trường thành summary có cấu trúc
    const summaryParts = [];
    if (editDocType) summaryParts.push(`Tài liệu này nói về gì: ${editDocType}`);
    if (editDocPurpose) summaryParts.push(`Mục đích tài liệu: ${editDocPurpose}`);
    if (editDocModules) summaryParts.push(`Module/Phân hệ chính: ${editDocModules}`);
    if (editDocFunctions) summaryParts.push(`Các chức năng chính: ${editDocFunctions}`);
    if (editDocFunctionDetails) summaryParts.push(`Chi tiết chức năng: ${editDocFunctionDetails}`);
    
    const combinedSummary = summaryParts.length > 0 ? summaryParts.join(' | ') : 'Không có mô tả';

    try {
      await axios.put(
        `${API_URL}/documents/${editingDoc.id}`,
        { summary: combinedSummary },
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
          }
        }
      );

      showMessage('success', 'Cập nhật tài liệu thành công!');
      handleCloseEditModal();
      fetchDocuments();
    } catch (error) {
      showMessage('error', error.response?.data?.detail || 'Lỗi khi cập nhật tài liệu');
    } finally {
      setIsUpdating(false);
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
                  placeholder="VD: Hướng dẫn module Quản lý Kho"
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

            <div className="space-y-4 border-t pt-4 mt-4">
              <h3 className="text-md font-semibold text-gray-800">Thông Tin Mô Tả (Giúp Chatbot hiểu rõ hơn)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1. Tài liệu này nói về gì?
                </label>
                <input
                  type="text"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  placeholder="Phân loại tài liệu. (VD: quy trình nghiệp vụ, tài liệu kỹ thuật, hướng dẫn sử dụng, chính sách công ty...)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isUploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2. Mục đích của tài liệu là gì ?
                </label>
                <input
                  type="text"
                  value={docPurpose}
                  onChange={(e) => setDocPurpose(e.target.value)}
                  placeholder="Tài liệu này dùng để làm gì? (VD: đào tạo người mới, hướng dẫn xử lý sự cố, quy định chính sách...)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isUploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  3. Module/Phân hệ chính
                </label>
                <input
                  type="text"
                  value={docModules}
                  onChange={(e) => setDocModules(e.target.value)}
                  placeholder="Tài liệu này thuộc về module, phòng ban hoặc phân hệ nào của ERP? (VD: Kế toán, Kho, Bán hàng, Nhân sự...)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isUploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  4. Các chức năng chính
                </label>
                <textarea
                  value={docFunctions}
                  onChange={(e) => setDocFunctions(e.target.value)}
                  placeholder="Liệt kê các chức năng hoặc nghiệp vụ chính được đề cập. (VD: tạo đơn hàng, duyệt phiếu chi, chấm công, tính lương...)"
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isUploading}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  5. Chi tiết về các chức năng
                </label>
                <textarea
                  value={docFunctionDetails}
                  onChange={(e) => setDocFunctionDetails(e.target.value)}
                  placeholder="Mô tả chi tiết hơn về cách các chức năng hoạt động hoặc các bước thực hiện. (VD: Để tạo đơn hàng, vào module Bán hàng -> Đơn hàng -> Tạo mới...)"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isUploading}
                ></textarea>
              </div>
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
                            onClick={() => handleOpenEditModal(doc)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg inline-flex items-center gap-2 transition"
                          >
                            <Edit className="w-4 h-4" />
                            Cập nhật
                          </button>
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

      {/* Modal Cập Nhật */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Cập Nhật Mô Tả Tài Liệu</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateSummary} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Tài liệu:</strong> {editingDoc?.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1. Tài liệu này nói về gì?
                </label>
                <input
                  type="text"
                  value={editDocType}
                  onChange={(e) => setEditDocType(e.target.value)}
                  placeholder="Phân loại tài liệu. (VD: quy trình nghiệp vụ, tài liệu kỹ thuật, hướng dẫn sử dụng...)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2. Mục đích của tài liệu là gì?
                </label>
                <input
                  type="text"
                  value={editDocPurpose}
                  onChange={(e) => setEditDocPurpose(e.target.value)}
                  placeholder="Tài liệu này dùng để làm gì? (VD: đào tạo người mới, hướng dẫn xử lý sự cố...)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  3. Module/Phân hệ chính
                </label>
                <input
                  type="text"
                  value={editDocModules}
                  onChange={(e) => setEditDocModules(e.target.value)}
                  placeholder="Tài liệu này thuộc về module nào? (VD: Kế toán, Kho, Bán hàng...)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  4. Các chức năng chính
                </label>
                <textarea
                  value={editDocFunctions}
                  onChange={(e) => setEditDocFunctions(e.target.value)}
                  placeholder="Liệt kê các chức năng hoặc nghiệp vụ chính được đề cập..."
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isUpdating}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  5. Chi tiết về các chức năng
                </label>
                <textarea
                  value={editDocFunctionDetails}
                  onChange={(e) => setEditDocFunctionDetails(e.target.value)}
                  placeholder="Mô tả chi tiết hơn về cách các chức năng hoạt động..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  disabled={isUpdating}
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Cập Nhật
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={isUpdating}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}