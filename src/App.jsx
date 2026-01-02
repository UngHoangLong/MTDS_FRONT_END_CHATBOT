import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Trash2, FileText, Send, Bot, User, Info, Loader2, Paperclip } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
// Import Logo của công ty
import mtdsLogo from './assets/logo_MTDS.png';
// Import avatar cho bot
import botAvatar from './assets/nova_software.jpg';
// Import component WorkflowDiagram
import WorkflowDiagram from './components/WorkflowDiagram';

// Import thư viện để xử lý Markdown
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- CẤU HÌNH ---
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

function App() {
  // --- STATE QUẢN LÝ TÀI LIỆU ---
  const [documents, setDocuments] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0); // <-- ĐÃ THÊM: Theo dõi tiến trình upload
  const [isProcessingDocId, setIsProcessingDocId] = useState(null); // <-- ĐÃ THÊM: Theo dõi tiến trình Xóa/Xem

  // --- STATE QUẢN LÝ CHAT ---
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Xin chào! Tôi là trợ lý ảo AI của MTDS. Hãy upload tài liệu bên trái và hỏi tôi bất cứ điều gì.', mode: 'direct' }
  ]);
  const [inputMsg, setInputMsg] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false); // State cho workflow modal
  
  // Ref để tự động cuộn xuống tin nhắn mới nhất
  const messagesEndRef = useRef(null);
  axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';
  // Hoặc thay đổi User-Agent (một số trường hợp cần)
  axios.defaults.headers.common['User-Agent'] = 'MTDS-Chatbot-App';

  // 1. KHỞI TẠO: Tạo Session ID & Lấy danh sách tài liệu khi vào trang
  useEffect(() => {
    let currentSession = sessionStorage.getItem("chat_session_id");
    if (!currentSession) {
      currentSession = uuidv4();
      sessionStorage.setItem("chat_session_id", currentSession);
    }
    setSessionId(currentSession);
    fetchDocuments();
    fetchSuggestions(); // Lấy câu hỏi gợi ý
  }, []);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- HÀM HỖ TRỢ ĐỊNH DẠNG NGÀY GIỜ ---
  const formatDateTime = (dateString) => {
    const createdAtDate = new Date(dateString);
    
    // Định dạng Ngày/Tháng/Năm
    const formattedDate = createdAtDate.toLocaleDateString('vi-VN'); 

    // Định dạng Giờ/Phút/Giây với AM/PM
    const formattedTime = createdAtDate.toLocaleTimeString('en-US', { 
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true 
    });

    return `${formattedDate}, ${formattedTime}`;
  };

  // --- CÁC HÀM GỌI API ---

  // Lấy câu hỏi gợi ý
  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const res = await axios.get(`${API_URL}/suggestions?n=6`);
      setSuggestions(res.data.suggestions || []);
    } catch (error) {
      console.error("Lỗi lấy suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Lấy danh sách tài liệu
  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_URL}/documents/`);
      setDocuments(res.data.documents || []);
    } catch (error) {
      console.error("Lỗi kết nối Backend:", error);
    }
  };

  // Upload tài liệu
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return alert("Vui lòng chọn file PDF!");

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("title", title);
    formData.append("summary", summary);

    setIsUploading(true);
    setUploadProgress(0); // Reset progress

    try {
      await axios.post(`${API_URL}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => { // <-- Thêm theo dõi tiến trình
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
        }
      });
      alert("Upload thành công! Hệ thống đang xử lý dữ liệu...");
      setUploadFile(null); setTitle(""); setSummary(""); // Reset form
      fetchDocuments(); // Load lại danh sách
    } catch (error) {
      alert("Lỗi upload: " + (error.response?.data?.detail || error.message));
    } finally {
      setIsUploading(false);
      setUploadProgress(0); // Reset sau khi hoàn tất
    }
  };

  // Xóa tài liệu
  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc muốn xóa tài liệu này?")) return;
    
    setIsProcessingDocId(id); // <-- START LOADING
    try {
      await axios.delete(`${API_URL}/documents/${id}`);
      fetchDocuments();
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch (error) {
      alert("Lỗi xóa: " + error.message);
    } finally {
      setIsProcessingDocId(null); // <-- STOP LOADING
    }
  };

  // Xem chi tiết tài liệu
  const handleViewDetail = async (id) => {
    setIsProcessingDocId(id); // <-- START LOADING
    try {
      const res = await axios.get(`${API_URL}/documents/${id}`);
      setSelectedDoc(res.data.document);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessingDocId(null); // <-- STOP LOADING
    }
  }

  // Gửi tin nhắn Chat với Streaming
  const handleSendMessage = async (messageText) => {
    const userQuery = messageText || inputMsg;
    if (!userQuery.trim()) return;

    // Hiển thị tin nhắn User ngay lập tức
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setInputMsg("");
    setIsChatting(true);

    try {
      // Gọi API Streaming
      const response = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({
          user_query: userQuery,
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let aiMode = 'direct';
      let aiReason = null;
      let hasAddedMessage = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.slice(6));
              
              if (jsonData.type === 'metadata') {
                aiMode = jsonData.content.mode || 'direct';
                aiReason = jsonData.content.reason || null;
              } else if (jsonData.type === 'token') {
                accumulatedContent += jsonData.content;
                
                // Chỉ thêm message AI khi có token đầu tiên
                if (!hasAddedMessage) {
                  setMessages(prev => [...prev, {
                    role: 'ai',
                    content: accumulatedContent,
                    mode: aiMode,
                    reason: aiReason
                  }]);
                  hasAddedMessage = true;
                } else {
                  // Cập nhật message cuối cùng - React batch updates tự động
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      ...newMessages[newMessages.length - 1],
                      content: accumulatedContent
                    };
                    return newMessages;
                  });
                }
              } else if (jsonData.type === 'end') {
                // Stream hoàn tất
                console.log('Stream completed');
              } else if (jsonData.type === 'error') {
                throw new Error(jsonData.content);
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

    } catch (error) {
      console.error('Streaming error:', error);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: "Xin lỗi, hệ thống đang bận hoặc mất kết nối với Server."
      }]);
    } finally {
      setIsChatting(false);
    }
  };

  // Click vào suggestion để gửi câu hỏi
  const handleSuggestionClick = (question) => {
    setInputMsg(question);
    handleSendMessage(question);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* --- CỘT TRÁI: QUẢN LÝ TÀI LIỆU --- */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-xl z-20">
        
        {/* HEADER CỘT TRÁI: Chỉ hiển thị Logo MTDS */}
        <div className="p-5 bg-blue-900 text-white shadow-md flex items-center gap-3 justify-center">
          <img 
            src={mtdsLogo} 
            alt="MTDS Logo" 
            className="h-10 w-auto brightness-0 invert" 
          />
        </div>

        {/* Form Upload */}
        <div className="p-4 bg-blue-50 border-b border-blue-100">
          <h3 className="text-xs font-bold text-blue-800 uppercase mb-3 flex items-center gap-1">
            <Paperclip size={14}/> Upload Tài liệu (PDF)
          </h3>
          <form onSubmit={handleUpload} className="flex flex-col gap-2">
            <input 
              type="file" accept=".pdf"
              onChange={e => setUploadFile(e.target.files[0])}
              className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-blue-200 file:text-blue-800 hover:file:bg-blue-300 cursor-pointer"
            />
            <input 
              type="text" placeholder="Tiêu đề..." required
              className="p-2 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none"
              value={title} onChange={e => setTitle(e.target.value)}
            />
            <input 
              type="text" placeholder="Mô tả ngắn..." 
              className="p-2 text-sm border border-gray-300 rounded focus:border-blue-500 outline-none"
              value={summary} onChange={e => setSummary(e.target.value)}
            />
            
            {/* THÊM Thanh Tiến Trình Upload */}
            {isUploading && (
                <div className="w-full bg-blue-200 rounded-full h-2.5 mb-1 relative">
                    <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${uploadProgress}%` }}
                    ></div>
                    {/* Nếu đã upload xong (100%) nhưng vẫn đang "Training" (isUploading) thì hiển thị loading animation */}
                    {uploadProgress === 100 && (
                       <div className="absolute inset-0 flex items-center justify-center">
                           <Loader2 className="animate-spin text-white" size={12}/>
                       </div>
                    )}
                </div>
            )}
            
            <button 
              type="submit" disabled={isUploading}
              className="bg-blue-600 text-white py-2 rounded text-sm font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 flex justify-center items-center gap-2"
            >
              {isUploading 
                ? (uploadProgress < 100 ? `${uploadProgress}% Đang tải lên...` : "Đang Training...")
                : "Tải lên & Training"}
            </button>
          </form>
        </div>

        {/* Danh sách tài liệu */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-xs font-bold text-gray-400 uppercase mb-2 px-2 mt-2">Kho dữ liệu ({documents.length})</div>
          <div className="flex flex-col gap-2">
            {documents.length === 0 && <div className="text-center text-gray-400 text-xs mt-4">Chưa có tài liệu nào.</div>}
            
            {documents.map(doc => (
              <div 
                key={doc.id} 
                onClick={() => handleViewDetail(doc.id)}
                className={`p-3 rounded-lg border cursor-pointer transition hover:shadow-md group relative
                  ${selectedDoc?.id === doc.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white border-gray-200 hover:border-blue-200'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {/* THÊM Spinner khi đang xử lý */}
                    {isProcessingDocId === doc.id 
                       ? <Loader2 size={16} className="text-blue-500 shrink-0 animate-spin"/>
                       : <FileText size={16} className="text-blue-500 shrink-0"/>
                    }
                    <span className="font-medium text-sm truncate">{doc.name}</span>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(doc.id, e)}
                    className={`text-gray-300 hover:text-red-500 transition ${isProcessingDocId === doc.id ? 'opacity-50 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}
                    title="Xóa tài liệu"
                    disabled={isProcessingDocId === doc.id}
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
                
                {/* Thanh tiến trình chạy liên tục cho Xóa/View */}
                {isProcessingDocId === doc.id && (
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-200 overflow-hidden">
                        <div className="bg-blue-500 h-0.5 animate-pulse w-full"></div> 
                    </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Xem chi tiết (Footer cột trái) */}
        {selectedDoc && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-gray-700 flex items-center gap-1">
                <Info size={14} className="text-blue-600"/> Thông tin chi tiết
              </h4>
              <button onClick={() => setSelectedDoc(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-1 text-gray-600 text-xs">
              <p><strong>ID:</strong> {selectedDoc.id}</p>
              <p><strong>Tên:</strong> {selectedDoc.name}</p>
              <p><strong>Tóm tắt:</strong> {selectedDoc.summary || "Không có"}</p>
              <p><strong>Số đoạn (Chunks):</strong> {selectedDoc.num_chunks}</p>
              <p><strong>Số lượng ảnh:</strong> {selectedDoc.num_images || "Không có"}</p>
              <p><strong>Ngày tạo:</strong> {formatDateTime(selectedDoc.created_at)}</p>
            </div>
          </div>
        )}
      </div>

      {/* --- CỘT PHẢI: KHUNG CHAT (NỀN XÁM TỐI HƠN/NGẢ ĐEN) --- */}
      <div className="flex-1 flex flex-col bg-gray-900 relative"> 
        
        {/* HEADER CHAT (Nền trắng) */}
        <div className="h-20 bg-white border-b border-gray-200 flex items-center px-6 justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <img 
              src={mtdsLogo} 
              alt="MTDS Logo" 
              className="h-10 w-auto" 
            />
            <div>
              <h2 className="font-extrabold text-gray-900 text-xl leading-snug">Trợ lý ảo thông minh MTDS</h2>
              <div className="flex items-center gap-1.5 text-xs text-green-600 mt-0.5">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className='font-semibold'>Sẵn sàng phục vụ</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowWorkflow(true)}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1.5"
            >
              Xem luồng xử lý
            </button>
            <div className="text-xs text-gray-400">Session: {sessionId.slice(0,8)}...</div>
          </div>
        </div>

        {/* Danh sách tin nhắn */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg overflow-hidden ${msg.role === 'user' ? 'bg-gray-600' : 'bg-white'}`}> 
                  {msg.role === 'user' ? <User size={20} className="text-white"/> : <img src={botAvatar} alt="Bot" className="w-full h-full object-cover" />}
                </div>

                {/* Bong bóng chat */}
                <div className={`p-4 rounded-xl shadow-lg text-[15px] leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-gray-700 text-white rounded-br-none ring-1 ring-gray-600' 
                    : 'bg-blue-500 text-white rounded-bl-none shadow-blue-400/20' 
                } `}>
                  {/* Sử dụng ReactMarkdown để xử lý ký hiệu ** */}
                  <div className={`prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 ${msg.role === 'ai' ? 'prose-invert' : 'prose-light text-white'}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Loading Indicator */}
          {isChatting && (
            <div className="flex justify-start gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden"><img src={botAvatar} alt="Bot" className="w-full h-full object-cover" /></div>
              <div className="bg-gray-700 p-4 rounded-xl shadow-sm flex items-center gap-2"> 
                <Loader2 className="animate-spin text-blue-400" size={18}/>
                <span className="text-sm text-gray-200 font-medium">Xin chờ trong giây lát...</span>
              </div>
            </div>
          )}

          {/* Hiển thị Suggestions nếu chưa có tin nhắn từ user */}
          {messages.filter(m => m.role === 'user').length === 0 && (
            <div className="max-w-3xl mx-auto mt-8">
              <h3 className="text-gray-400 text-sm font-semibold mb-4 text-center">
                💡 Câu hỏi gợi ý
              </h3>
              
              {isLoadingSuggestions ? (
                <div className="flex justify-center items-center gap-2 text-gray-500">
                  <Loader2 className="animate-spin" size={20}/>
                  <span className="text-sm">Đang tải gợi ý...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(sug.question)}
                      disabled={isChatting}
                      className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500 rounded-xl text-left transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-500/30 transition">
                          <span className="text-blue-400 text-lg">💬</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium mb-1 group-hover:text-blue-300 transition">
                            {sug.question}
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-blue-900/40 text-blue-300 rounded">
                              {sug.category}
                            </span>
                            <span className="text-gray-500 truncate">
                              {sug.source}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Chat */}
        <div className="p-5 bg-gray-950 border-t border-gray-800"> 
          <div className="max-w-4xl mx-auto relative flex gap-2">
            <input 
              type="text"
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Nhập câu hỏi của bạn về tài liệu..."
              disabled={isChatting}
              className="flex-1 p-4 pl-6 border border-gray-700 rounded-full focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/30 transition shadow-lg bg-gray-800 text-white placeholder-gray-400"
            />
            <button 
              onClick={handleSendMessage}
              disabled={isChatting || !inputMsg.trim()}
              className="w-14 h-14 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-600 transition flex items-center justify-center shadow-lg active:scale-95"
            >
              <Send size={22}/>
            </button>
          </div>
          <div className="text-center mt-3 text-xs text-gray-500">
            Được phát triển bởi MTDS AI Team
          </div>
        </div>
      </div>

      {/* Workflow Diagram Modal */}
      <WorkflowDiagram isOpen={showWorkflow} onClose={() => setShowWorkflow(false)} />
    </div>
  );
}

export default App;