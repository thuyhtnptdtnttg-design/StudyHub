import React, { useState, useRef, useEffect } from 'react';
import { analyzeFreeSpeaking, generateDialogue, assessDialogueLine, chatWithFriend } from '../services/geminiService';
import { SpeakingFeedback, SpeakingMode, DialogueLine, ChatMessage } from '../types';
import { ComicButton, ComicCard, ComicInput, LoadingSpinner } from './ui';
import { Mic, Square, PlayCircle, MessageCircle, BookOpen, Sparkles, Send } from 'lucide-react';

export const SpeakingModule = ({ addXP }: { addXP: (amount: number) => void }) => {
  const [mode, setMode] = useState<SpeakingMode>(SpeakingMode.FREE);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  // Mode 1: Free
  const [freeFeedback, setFreeFeedback] = useState<SpeakingFeedback | null>(null);

  // Mode 2: Topic
  const [topic, setTopic] = useState('');
  const [dialogue, setDialogue] = useState<DialogueLine[]>([]);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);

  // Mode 3: Chat
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (chatBottomRef.current) {
        chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleStartRecording = async (lineId?: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64String = (reader.result as string).split(',')[1];
            await processAudio(base64String, lineId);
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      if (lineId) setActiveLineId(lineId);
    } catch (err) {
      console.error(err);
      alert("Cần quyền truy cập microphone!");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (base64: string, lineId?: string) => {
    setLoading(true);
    try {
        if (mode === SpeakingMode.FREE) {
            const data = await analyzeFreeSpeaking(base64);
            setFreeFeedback(data);
            addXP(20);
        } else if (mode === SpeakingMode.TOPIC && lineId) {
            const line = dialogue.find(l => l.id === lineId);
            if (line) {
                const data = await assessDialogueLine(base64, line.text);
                setDialogue(prev => prev.map(l => l.id === lineId ? { ...l, feedback: data } : l));
                addXP(10);
            }
            setActiveLineId(null);
        } else if (mode === SpeakingMode.CHAT) {
            // Optimistic update for user message (placeholder)
            const tempId = Date.now().toString();
            
            const result = await chatWithFriend(base64, chatHistory);
            
            const userMsg: ChatMessage = {
                id: tempId,
                sender: 'user',
                text: result.userTranscript || "...",
                correction: result.correction
            };
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: result.reply
            };

            setChatHistory(prev => [...prev, userMsg, aiMsg]);
            addXP(15);
        }
    } catch (error) {
        console.error(error);
        alert("Có lỗi xảy ra khi xử lý giọng nói.");
    } finally {
        setLoading(false);
    }
  };

  const generateTopicDialogue = async () => {
      if (!topic) return;
      setLoading(true);
      setDialogue([]);
      try {
          const lines = await generateDialogue(topic);
          setDialogue(lines);
      } catch (e) {
          alert("Lỗi tạo hội thoại");
      } finally {
          setLoading(false);
      }
  };

  const speakText = (text: string) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Mode Selector */}
        <div className="flex flex-wrap gap-2 justify-center animate-slide-up">
            <button 
                onClick={() => setMode(SpeakingMode.FREE)}
                className={`px-6 py-2 rounded-full font-hand font-bold text-lg border-2 border-black transition-all ${mode === SpeakingMode.FREE ? 'bg-accent-blue shadow-comic -translate-y-1' : 'bg-white hover:bg-gray-100'}`}
            >
                🗣️ Nói Tự Do
            </button>
            <button 
                onClick={() => setMode(SpeakingMode.TOPIC)}
                className={`px-6 py-2 rounded-full font-hand font-bold text-lg border-2 border-black transition-all ${mode === SpeakingMode.TOPIC ? 'bg-accent-green shadow-comic -translate-y-1' : 'bg-white hover:bg-gray-100'}`}
            >
                🎭 Theo Chủ Đề
            </button>
            <button 
                onClick={() => setMode(SpeakingMode.CHAT)}
                className={`px-6 py-2 rounded-full font-hand font-bold text-lg border-2 border-black transition-all ${mode === SpeakingMode.CHAT ? 'bg-accent-pink shadow-comic -translate-y-1' : 'bg-white hover:bg-gray-100'}`}
            >
                💬 Chat AI
            </button>
        </div>

        {/* MODE 1: FREE SPEAKING */}
        {mode === SpeakingMode.FREE && (
            <div className="flex flex-col items-center space-y-6 animate-fade-in">
                <div className="text-center">
                    <h3 className="text-2xl font-hand font-bold">Chấm điểm phát âm tự do</h3>
                    <p className="text-gray-600">Nói bất cứ câu tiếng Anh nào bạn thích!</p>
                </div>
                
                <div className="relative">
                    <button
                        onClick={isRecording ? handleStopRecording : () => handleStartRecording()}
                        className={`w-24 h-24 rounded-full border-4 border-black flex items-center justify-center transition-all shadow-comic hover:scale-105 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white'}`}
                    >
                        {isRecording ? <Square size={32} fill="currentColor"/> : <Mic size={40} />}
                    </button>
                </div>

                {loading && <LoadingSpinner />}

                {freeFeedback && !loading && (
                    <div className="w-full animate-slide-up">
                         <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-comic space-y-4">
                            <div className="flex justify-between items-center border-b-2 border-gray-100 pb-4">
                                <div>
                                    <p className="text-sm text-gray-500 font-bold">ĐIỂM SỐ</p>
                                    <p className="text-5xl font-bold font-hand text-accent-blue">{freeFeedback.score}/10</p>
                                </div>
                                <div className="text-right max-w-xs">
                                    <p className="font-hand font-bold text-lg">"{freeFeedback.encouragement}"</p>
                                </div>
                            </div>
                            
                            <div>
                                <p className="font-bold text-gray-700 mb-1">AI nghe được:</p>
                                <p className="bg-gray-100 p-3 rounded-xl font-mono text-gray-800">"{freeFeedback.transcript}"</p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                    <p className="font-bold text-green-800 mb-2">✅ Câu nên nói:</p>
                                    <p className="text-green-900 italic">"{freeFeedback.correction}"</p>
                                    <button onClick={() => speakText(freeFeedback.correction)} className="mt-2 text-xs bg-white px-2 py-1 rounded border border-green-300 flex items-center gap-1 hover:bg-green-100">
                                        <PlayCircle size={14} /> Nghe mẫu
                                    </button>
                                </div>
                                <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                                    <p className="font-bold text-red-800 mb-2">❌ Từ cần sửa:</p>
                                    {freeFeedback.mistakes.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {freeFeedback.mistakes.map((m, i) => (
                                                <span key={i} className="bg-white px-2 py-1 rounded text-red-600 text-sm border border-red-200">{m}</span>
                                            ))}
                                        </div>
                                    ) : <p className="text-sm text-gray-500">Không có lỗi nào đáng kể. Tuyệt vời!</p>}
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                <p className="font-bold text-blue-800">💡 Nhận xét:</p>
                                <p className="text-gray-800">{freeFeedback.comment}</p>
                            </div>
                         </div>
                    </div>
                )}
            </div>
        )}

        {/* MODE 2: TOPIC DIALOGUE */}
        {mode === SpeakingMode.TOPIC && (
            <div className="space-y-6 animate-fade-in">
                <div className="flex gap-2">
                    <ComicInput 
                        value={topic} 
                        onChange={(e) => setTopic(e.target.value)} 
                        placeholder="Nhập chủ đề (VD: Shopping, Travel, Friends...)"
                    />
                    <ComicButton onClick={generateTopicDialogue} disabled={loading}>
                        {loading ? <LoadingSpinner /> : 'Tạo Hội Thoại'}
                    </ComicButton>
                </div>

                <div className="space-y-4">
                    {dialogue.map((line) => (
                        <div key={line.id} className={`flex ${line.speaker === 'Student' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                            <div className={`max-w-[80%] space-y-2`}>
                                <div className={`p-4 rounded-2xl border-2 border-black shadow-sm ${line.speaker === 'Student' ? 'bg-accent-yellow' : 'bg-white'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold uppercase text-gray-500">{line.speaker}</span>
                                        <button onClick={() => speakText(line.text)} className="opacity-50 hover:opacity-100"><PlayCircle size={16}/></button>
                                    </div>
                                    <p className="text-lg font-medium">{line.text}</p>
                                </div>

                                {line.speaker === 'Student' && (
                                    <div className="flex flex-col items-end gap-2">
                                        {activeLineId === line.id && isRecording ? (
                                             <button onClick={handleStopRecording} className="bg-red-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 animate-pulse">
                                                <Square size={16} fill="white"/> Dừng
                                             </button>
                                        ) : (
                                            <button onClick={() => handleStartRecording(line.id)} className="bg-accent-blue border-2 border-black text-black px-4 py-2 rounded-full font-bold text-sm hover:-translate-y-1 transition-transform flex items-center gap-2 shadow-comic">
                                                <Mic size={16} /> Luyện câu này
                                            </button>
                                        )}
                                        
                                        {line.feedback && (
                                            <div className="w-full bg-white p-3 rounded-xl border border-gray-200 text-sm animate-pop-in">
                                                <div className="flex justify-between font-bold mb-1">
                                                    <span className={line.feedback.score >= 8 ? 'text-green-600' : 'text-orange-600'}>
                                                        Điểm: {line.feedback.score}/10
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 italic mb-1">"{line.feedback.encouragement}"</p>
                                                {line.feedback.mistakes.length > 0 && (
                                                    <p className="text-red-500">Lỗi: {line.feedback.mistakes.join(", ")}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* MODE 3: FRIENDLY CHAT */}
        {mode === SpeakingMode.CHAT && (
            <div className="flex flex-col h-[600px] border-2 border-black rounded-3xl bg-white shadow-comic overflow-hidden animate-fade-in">
                <div className="bg-accent-pink p-4 border-b-2 border-black flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full border-2 border-black flex items-center justify-center">
                        <Sparkles size={20} className="text-yellow-500" />
                    </div>
                    <div>
                        <h3 className="font-bold font-hand text-xl">AI Bestie</h3>
                        <p className="text-xs">Luôn lắng nghe, luôn thấu hiểu</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {chatHistory.length === 0 && (
                        <div className="text-center text-gray-400 mt-10 font-hand text-xl">
                            <p>Nhấn micro và nói "Hello" để bắt đầu trò chuyện nào!</p>
                        </div>
                    )}
                    {chatHistory.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl border-2 border-black text-lg relative ${msg.sender === 'user' ? 'bg-accent-blue rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                                <p>{msg.text}</p>
                                {msg.sender === 'ai' && (
                                     <button onClick={() => speakText(msg.text)} className="absolute bottom-2 right-2 opacity-20 hover:opacity-100">
                                        <PlayCircle size={16} />
                                     </button>
                                )}
                            </div>
                            
                            {/* Correction Bubble */}
                            {msg.sender === 'user' && msg.correction && (
                                <div className="mt-2 max-w-[80%] bg-yellow-50 border border-yellow-200 p-3 rounded-xl text-sm animate-pop-in">
                                    <p className="font-bold text-yellow-800 mb-1 flex items-center gap-1">
                                        <Sparkles size={12}/> Gợi ý sửa lỗi:
                                    </p>
                                    <p className="text-red-400 line-through text-xs">{msg.correction.original}</p>
                                    <p className="text-green-600 font-bold">➜ {msg.correction.fixed}</p>
                                    <p className="text-gray-500 text-xs italic mt-1">{msg.correction.explanation}</p>
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={chatBottomRef} />
                </div>

                <div className="p-4 bg-white border-t-2 border-black flex items-center justify-center gap-4">
                    {loading ? (
                        <div className="flex items-center gap-2 text-gray-500 font-hand font-bold animate-pulse">
                            Đang suy nghĩ... <LoadingSpinner />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                             <button
                                onClick={isRecording ? handleStopRecording : () => handleStartRecording()}
                                className={`w-16 h-16 rounded-full border-2 border-black flex items-center justify-center transition-all shadow-comic active:scale-95 ${isRecording ? 'bg-red-500 text-white animate-ping' : 'bg-accent-green hover:bg-green-300'}`}
                            >
                                {isRecording ? <Square fill="currentColor" /> : <Mic size={28} />}
                            </button>
                            <p className="text-xs font-bold text-gray-400">{isRecording ? "Đang nghe..." : "Nhấn để nói"}</p>
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};