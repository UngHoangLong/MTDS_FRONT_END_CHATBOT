import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { X, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function WorkflowDiagram({ isOpen, onClose }) {
  const [diagram, setDiagram] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const mermaidRef = useRef(null);

  // Khởi tạo Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#3B82F6',
        primaryTextColor: '#fff',
        primaryBorderColor: '#1E40AF',
        lineColor: '#60A5FA',
        secondaryColor: '#10B981',
        tertiaryColor: '#F59E0B',
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
      }
    });
  }, []);

  // Fetch workflow diagram từ backend
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      axios.get(`${API_URL}/chat/workflow`)
        .then(response => {
          setDiagram(response.data.diagram);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Failed to fetch workflow:', error);
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  // Render diagram khi có data
  useEffect(() => {
    if (diagram && mermaidRef.current && !isLoading) {
      mermaidRef.current.innerHTML = diagram;
      mermaid.run({
        nodes: [mermaidRef.current],
      }).catch(err => {
        console.error('Mermaid rendering error:', err);
      });
    }
  }, [diagram, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Luồng Xử Lý Chat Workflow</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-blue-400" size={48} />
              <p className="text-gray-400 text-lg">Đang tải workflow...</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div ref={mermaidRef} className="mermaid"></div>
            </div>
          )}

          {/* Legend */}
          {!isLoading && (
            <div className="mt-6 bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="text-sm font-bold text-gray-300 mb-3">Chú thích:</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-600"></div>
                  <span className="text-gray-400">Điểm bắt đầu</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-600"></div>
                  <span className="text-gray-400">Điểm kết thúc</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-600"></div>
                  <span className="text-gray-400">Điểm quyết định</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-600"></div>
                  <span className="text-gray-400">Xử lý bằng LLM</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-600"></div>
                  <span className="text-gray-400">Yêu cầu làm rõ</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkflowDiagram;
