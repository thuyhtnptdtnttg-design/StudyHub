import React, { useState, useRef } from 'react';
import { analyzeWriting } from '../services/geminiService';
import { WritingAnalysis } from '../types';
import { ComicButton, ComicCard, LoadingSpinner } from './ui';
import { Edit3, Check, Wand2, Image as ImageIcon, FileText, Upload, X } from 'lucide-react';

export const WritingModule = ({ addXP }: { addXP: (amount: number) => void }) => {
  const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<WritingAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleCheck = async () => {
    const content = inputMode === 'image' ? selectedImage?.split(',')[1] : text;

    if (!content) {
        alert("Vui lòng nhập nội dung!");
        return;
    }
    if (inputMode === 'text' && content.length < 10) {
         alert("Vui lòng nhập đoạn văn dài hơn!");
         return;
    }

    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeWriting(inputMode, content);
      setResult(data);
      addXP(20);
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi chấm bài.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-6 animate-fade-in">
      {/* Input Section */}
      <div className="flex-1 space-y-4">
        <h2 className="text-3xl font-hand font-bold mb-4 flex items-center gap-2 animate-slide-up">
            <Edit3 className="text-accent-blue animate-wiggle" />
            Luyện Viết
        </h2>

        <div className="flex gap-4 animate-slide-up delay-100 mb-2">
            <button 
                onClick={() => setInputMode('text')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold border-2 border-black transition-all ${inputMode === 'text' ? 'bg-accent-blue shadow-comic -translate-y-1' : 'bg-white hover:bg-gray-50'}`}
            >
                <FileText size={18}/> Nhập Chữ
            </button>
            <button 
                onClick={() => setInputMode('image')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold border-2 border-black transition-all ${inputMode === 'image' ? 'bg-accent-pink shadow-comic -translate-y-1' : 'bg-white hover:bg-gray-50'}`}
            >
                <ImageIcon size={18}/> Chụp Ảnh
            </button>
        </div>

        <div className="animate-slide-up delay-200">
            {inputMode === 'text' ? (
                <ComicCard className="p-0 overflow-hidden" color="bg-white">
                    <textarea
                        className="w-full h-80 p-6 font-sans text-lg focus:outline-none resize-none"
                        placeholder="Nhập bài viết tiếng Anh của bạn vào đây (Essay, Email, Paragraph)..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </ComicCard>
            ) : (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-4 border-dashed border-gray-300 rounded-2xl h-80 bg-paper cursor-pointer hover:bg-gray-50 hover:border-accent-pink transition-colors flex flex-col items-center justify-center relative overflow-hidden group"
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                    />
                    {selectedImage ? (
                        <>
                            <img src={selectedImage} alt="Preview" className="h-full w-full object-contain" />
                            <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                            >
                                <X size={20} />
                            </button>
                        </>
                    ) : (
                        <div className="text-center space-y-4 text-gray-400 group-hover:text-accent-pink transition-colors">
                            <Upload size={48} className="mx-auto animate-bounce-slow" />
                            <p className="font-hand text-xl font-bold">Tải ảnh bài viết tay lên đây</p>
                        </div>
                    )}
                </div>
            )}
        </div>
        
        <div className="flex justify-end animate-slide-up delay-300">
            <ComicButton onClick={handleCheck} disabled={loading} className="w-full md:w-auto">
                {loading ? <LoadingSpinner /> : (
                    <span className="flex items-center gap-2"><Check /> Chấm Bài Ngay</span>
                )}
            </ComicButton>
        </div>
      </div>

      {/* Result Section */}
      <div className="flex-1 space-y-4">
        {result && (
            <div className="space-y-6">
                <div className="animate-pop-in">
                    <ComicCard color="bg-accent-blue" className="text-center py-8">
                        <p className="font-hand text-xl">Điểm Tổng Quát</p>
                        <h3 className="text-6xl font-bold font-sans mt-2">{result.score}<span className="text-3xl">/10</span></h3>
                        <div className="flex justify-center gap-4 mt-4 text-sm font-sans font-bold">
                            <div className="bg-white/50 px-3 py-1 rounded-lg">Vocab: {result.vocabScore}</div>
                            <div className="bg-white/50 px-3 py-1 rounded-lg">Grammar: {result.grammarScore}</div>
                            <div className="bg-white/50 px-3 py-1 rounded-lg">Coherence: {result.coherenceScore}</div>
                        </div>
                    </ComicCard>
                </div>

                <div className="animate-slide-up delay-100">
                    <ComicCard>
                        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                            <Wand2 size={20} className="text-purple-500 animate-spin-slow"/> 
                            Nhận xét của AI
                        </h4>
                        <p className="font-sans text-gray-700 leading-relaxed">{result.feedback}</p>
                    </ComicCard>
                </div>

                {result.mistakes.length > 0 && (
                     <div className="space-y-3 animate-slide-up delay-200">
                        <h4 className="font-bold text-lg font-hand">Lỗi cần sửa ({result.mistakes.length})</h4>
                        {result.mistakes.map((m, idx) => (
                            <div key={idx} className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl transform transition-all hover:translate-x-1">
                                <p className="text-red-500 line-through text-sm font-sans mb-1">{m.original}</p>
                                <p className="text-green-600 font-bold font-sans flex items-center gap-2">
                                    ➜ {m.correction}
                                </p>
                                <p className="text-gray-600 text-xs mt-1 italic">{m.explanation}</p>
                            </div>
                        ))}
                     </div>
                )}
                
                <div className="animate-slide-up delay-300">
                    <ComicCard color="bg-accent-green">
                        <h4 className="font-bold text-lg mb-2">Bài viết đã nâng cấp</h4>
                        <p className="font-sans text-sm italic">{result.correctedText}</p>
                    </ComicCard>
                </div>
            </div>
        )}
        {!result && !loading && (
            <div className="h-full flex items-center justify-center opacity-50 border-2 border-dashed border-gray-300 rounded-2xl p-12 animate-pulse-slow">
                <p className="text-center font-hand text-xl">Kết quả chấm bài sẽ hiện ở đây</p>
            </div>
        )}
      </div>
    </div>
  );
};