
import React, { useState, useRef } from 'react';
import { generateContentAnalysis } from '../services/geminiService';
import { MindMapNode, ContentAnalysisResult, SummaryLength, AnalysisOptions } from '../types';
import { ComicButton, ComicCard, LoadingSpinner } from './ui';
import { Network, Image as ImageIcon, Upload, FileText, CheckCircle, PlayCircle, PauseCircle, Download, FileAudio, Settings, Volume2 } from 'lucide-react';

export const MindmapModule = ({ addXP }: { addXP: (amount: number) => void }) => {
  const [activeTab, setActiveTab] = useState<'image' | 'text'>('image');
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<ContentAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Options State
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');
  const [outputMode, setOutputMode] = useState<'both' | 'summary' | 'mindmap'>('both');
  const [showOptions, setShowOptions] = useState(true);

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLang, setAudioLang] = useState<'vi-VN' | 'en-US'>('vi-VN');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    const content = activeTab === 'image' 
        ? selectedImage?.split(',')[1] 
        : inputText;
    
    if (!content) {
        alert("Vui lòng nhập nội dung hoặc chọn ảnh!");
        return;
    }

    setLoading(true);
    setResult(null);
    setIsPlaying(false);
    window.speechSynthesis.cancel(); // Stop any previous speech

    try {
        const options: AnalysisOptions = {
            summaryLength,
            mode: outputMode
        };
        
        const data = await generateContentAnalysis({
            type: activeTab,
            content: content
        }, options);
        
        setResult(data);
        addXP(30);
    } catch (e) {
        console.error(e);
        alert("Lỗi khi xử lý. Vui lòng thử lại.");
    } finally {
        setLoading(false);
    }
  };

  const handlePlayAudio = () => {
      if (!result?.summary) return;

      if (isPlaying) {
          window.speechSynthesis.cancel();
          setIsPlaying(false);
          return;
      }

      const utterance = new SpeechSynthesisUtterance(result.summary);
      utterance.lang = audioLang;
      
      // Attempt to pick a "natural" sounding voice if available (e.g. Google voices)
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
          v.lang === audioLang && 
          (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural'))
      ) || voices.find(v => v.lang === audioLang);

      if (preferredVoice) {
          utterance.voice = preferredVoice;
      }

      utterance.rate = 1.0;
      
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
  };

  const renderNode = (node: MindMapNode) => {
    return (
        <div className="flex flex-col items-center animate-pop-in">
            <div 
                className="px-4 py-3 border-2 border-black rounded-2xl bg-white shadow-comic mb-8 text-center min-w-[120px] max-w-[220px] transition-transform hover:scale-105 z-10 relative group"
                style={{ backgroundColor: node.color || '#fff' }}
            >
                <span className="font-hand font-bold text-lg text-ink leading-tight block">{node.label}</span>
                {node.note && (
                    <div className="hidden group-hover:block absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-black text-white text-xs p-2 rounded-lg z-20">
                        {node.note}
                    </div>
                )}
            </div>
            
            {node.children && node.children.length > 0 && (
                <div className="flex gap-4 md:gap-8 relative">
                    {/* Visual Connectors */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-8 w-1 h-8 bg-black/80"></div>
                    <div className="absolute top-0 left-0 right-0 -mt-8 h-1 bg-black/80 mx-auto w-[calc(100%-2rem)] rounded-full"></div> 
                    
                    {node.children.map((child, idx) => (
                        <div key={child.id || idx} className="relative pt-8 flex flex-col items-center">
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-8 w-1 h-8 bg-black/80"></div>
                            {renderNode(child)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in p-4 pb-20">
         <div className="text-center animate-slide-up space-y-2">
            <h2 className="text-4xl font-hand font-bold flex items-center justify-center gap-3">
                <BrainCircuitIcon /> Phân Tích Nội Dung Thông Minh
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Tóm tắt văn bản, chuyển giọng nói và vẽ sơ đồ tư duy chỉ trong 1 chạm.</p>
       </div>

       {/* Input Section */}
       <div className="flex flex-col items-center gap-6 animate-slide-up delay-100">
            {/* Tabs */}
            <div className="flex gap-4">
                <button 
                    onClick={() => setActiveTab('image')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold border-2 border-black transition-all ${activeTab === 'image' ? 'bg-accent-blue shadow-comic -translate-y-1' : 'bg-white hover:bg-gray-50'}`}
                >
                    <ImageIcon size={20}/> Tải Ảnh
                </button>
                <button 
                    onClick={() => setActiveTab('text')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold border-2 border-black transition-all ${activeTab === 'text' ? 'bg-accent-yellow shadow-comic -translate-y-1' : 'bg-white hover:bg-gray-50'}`}
                >
                    <FileText size={20}/> Nhập Chữ
                </button>
            </div>

            {/* Content Input */}
            <div className="w-full max-w-3xl">
                {activeTab === 'image' ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-4 border-dashed border-gray-300 rounded-3xl p-8 bg-paper cursor-pointer hover:bg-gray-50 hover:border-accent-blue transition-colors flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden group"
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageUpload}
                        />
                        {selectedImage ? (
                            <img src={selectedImage} alt="Preview" className="h-48 object-contain z-10 shadow-sm rounded-lg" />
                        ) : (
                            <div className="text-center space-y-2 text-gray-400 group-hover:text-accent-blue transition-colors">
                                <Upload size={48} className="mx-auto animate-bounce-slow" />
                                <p className="font-hand text-xl font-bold">Chạm để tải ảnh bài học</p>
                            </div>
                        )}
                        {selectedImage && (
                             <div className="absolute top-4 right-4 bg-green-500 text-white p-2 rounded-full animate-pop-in">
                                <CheckCircle size={20} />
                             </div>
                        )}
                    </div>
                ) : (
                    <ComicCard color="bg-white" className="p-0">
                        <textarea 
                            className="w-full p-6 text-lg font-sans border-none focus:outline-none min-h-[200px] resize-none rounded-xl"
                            placeholder="Dán nội dung bài học vào đây..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                    </ComicCard>
                )}
            </div>

            {/* Options Panel */}
            <div className="w-full max-w-3xl bg-white border-2 border-black rounded-2xl overflow-hidden shadow-comic">
                <div 
                    onClick={() => setShowOptions(!showOptions)}
                    className="bg-gray-100 p-3 flex justify-between items-center cursor-pointer hover:bg-gray-200 transition-colors"
                >
                    <span className="font-bold font-hand text-lg flex items-center gap-2"><Settings size={18}/> Tùy chỉnh xử lý</span>
                    <span className="text-xs font-bold text-gray-500">{showOptions ? 'Thu gọn' : 'Mở rộng'}</span>
                </div>
                
                {showOptions && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Độ dài tóm tắt</label>
                            <div className="flex gap-2">
                                {(['short', 'medium', 'long'] as SummaryLength[]).map((len) => (
                                    <button
                                        key={len}
                                        onClick={() => setSummaryLength(len)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all ${summaryLength === len ? 'bg-accent-pink border-black text-black' : 'bg-white border-gray-200 text-gray-500'}`}
                                    >
                                        {len === 'short' ? 'Ngắn' : len === 'medium' ? 'Vừa' : 'Chi tiết'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Chế độ đầu ra</label>
                            <div className="flex gap-2">
                                <button onClick={() => setOutputMode('summary')} className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all ${outputMode === 'summary' ? 'bg-accent-green border-black' : 'bg-white border-gray-200'}`}>Văn bản</button>
                                <button onClick={() => setOutputMode('mindmap')} className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all ${outputMode === 'mindmap' ? 'bg-accent-green border-black' : 'bg-white border-gray-200'}`}>Sơ đồ</button>
                                <button onClick={() => setOutputMode('both')} className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all ${outputMode === 'both' ? 'bg-accent-green border-black' : 'bg-white border-gray-200'}`}>Cả hai</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ComicButton 
                onClick={handleGenerate} 
                disabled={loading || (activeTab === 'image' && !selectedImage) || (activeTab === 'text' && !inputText)}
                className="px-12 py-3 text-xl bg-black text-white hover:bg-gray-800"
            >
                {loading ? <LoadingSpinner /> : (
                    <span className="flex items-center gap-2"><Network /> Phân Tích Ngay</span>
                )}
            </ComicButton>
       </div>

       {/* Results Section */}
       {result && (
           <div className="space-y-8 animate-slide-up delay-200">
               
               {/* Summary Card */}
               {(outputMode === 'summary' || outputMode === 'both') && (
                    <div className="bg-white border-2 border-black rounded-3xl p-6 shadow-comic relative">
                        <div className="absolute -top-4 left-6 bg-accent-yellow border-2 border-black px-4 py-1 rounded-full font-bold font-hand shadow-sm transform -rotate-2">
                            📌 Tóm Tắt Nội Dung
                        </div>
                        
                        <div className="mt-4 font-hand text-xl leading-relaxed text-gray-800 space-y-4 text-justify">
                             {result.summary.split('\n').map((line, i) => (
                                 <p key={i}>{line}</p>
                             ))}
                        </div>

                        {/* Action Bar */}
                        <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <select 
                                    value={audioLang} 
                                    onChange={(e) => setAudioLang(e.target.value as any)}
                                    className="font-hand font-bold border-2 border-black rounded-lg px-2 py-2 bg-white text-sm focus:outline-none cursor-pointer hover:bg-gray-50"
                                >
                                    <option value="vi-VN">🇻🇳 Tiếng Việt</option>
                                    <option value="en-US">🇺🇸 English</option>
                                </select>
                                <button 
                                    onClick={handlePlayAudio}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold border-2 border-black transition-all ${isPlaying ? 'bg-red-400 text-white animate-pulse' : 'bg-accent-blue hover:bg-blue-300'}`}
                                >
                                    {isPlaying ? <PauseCircle size={20}/> : <PlayCircle size={20}/>}
                                    {isPlaying ? 'Dừng đọc' : 'Nghe tóm tắt'}
                                </button>
                            </div>
                            
                            {/* Keywords Chips */}
                            <div className="flex flex-wrap gap-2 items-center ml-auto">
                                <span className="text-sm font-bold text-gray-500 mr-2">Từ khóa:</span>
                                {result.keywords.map((kw, i) => (
                                    <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm border border-gray-300 font-bold text-gray-600">
                                        #{kw}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
               )}

               {/* Mindmap Card */}
               {(outputMode === 'mindmap' || outputMode === 'both') && result.rootNode && (
                   <div className="space-y-2">
                       <h3 className="font-hand font-bold text-2xl ml-4">🧠 Sơ Đồ Tư Duy</h3>
                       <div className="bg-paper border-2 border-black rounded-3xl p-8 min-h-[500px] overflow-x-auto flex justify-center items-start shadow-inner relative">
                           <div className="absolute top-4 left-4 text-gray-300 font-bold font-hand text-4xl opacity-20 select-none">MINDMAP</div>
                           <div className="mt-8 scale-90 origin-top">
                               {renderNode(result.rootNode)}
                           </div>
                       </div>
                       <div className="flex justify-end mt-2">
                            <button onClick={() => window.print()} className="text-sm font-bold text-gray-500 hover:text-black flex items-center gap-1">
                                <Download size={16}/> Lưu / In sơ đồ
                            </button>
                       </div>
                   </div>
               )}
           </div>
       )}
    </div>
  );
};

const BrainCircuitIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
        <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
        <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
        <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
        <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
        <path d="M3.477 12.578a4 4 0 0 1 .399-1.375" />
        <path d="M13 19v-4h3l4 8" />
        <path d="M11 19v-4H8l-4 8" />
    </svg>
);
