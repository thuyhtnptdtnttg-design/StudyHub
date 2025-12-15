
import React, { useState } from 'react';
import { Flashcard, QuizQuestion, FlashcardLevel, FlashcardStyle } from '../types';
import { generateFlashcards, generateVocabularyQuiz, createSingleFlashcard } from '../services/geminiService';
import { ComicButton, ComicCard, ComicInput, LoadingSpinner } from './ui';
import { Volume2, CheckCircle, XCircle, List, Sparkles, Brain, ArrowRight, RotateCcw, PlusCircle, Save } from 'lucide-react';

export const FlashcardModule = ({ addXP }: { addXP: (amount: number) => void }) => {
  const [inputMode, setInputMode] = useState<'topic' | 'list' | 'single'>('topic');
  const [inputValue, setInputValue] = useState('');
  
  // Single Card Creation State
  const [singleWord, setSingleWord] = useState('');
  const [singleTopic, setSingleTopic] = useState('Daily Life');
  const [singleLevel, setSingleLevel] = useState<FlashcardLevel>('medium');
  const [singleStyle, setSingleStyle] = useState<FlashcardStyle>('hand_drawn');
  const [previewCard, setPreviewCard] = useState<Flashcard | null>(null);

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Learning State
  const [viewMode, setViewMode] = useState<'learn' | 'quiz'>('learn');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleGenerate = async () => {
    if (inputMode === 'single') {
        if (!singleWord.trim()) return;
        setLoading(true);
        try {
            const newCard = await createSingleFlashcard(singleWord, singleTopic, singleLevel, singleStyle);
            setPreviewCard(newCard);
        } catch (error) {
            console.error(error);
            alert("Lỗi khi tạo thẻ.");
        } finally {
            setLoading(false);
        }
    } else {
        if (!inputValue.trim()) return;
        setLoading(true);
        setCards([]);
        setQuizQuestions([]);
        setViewMode('learn');
        try {
            const generated = await generateFlashcards(inputMode, inputValue);
            setCards(generated);
            setCurrentIndex(0);
            setIsFlipped(false);
        } catch (error) {
            console.error(error);
            alert("Lỗi khi tạo flashcard. Vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    }
  };

  const handleSaveSingleCard = () => {
      if (previewCard) {
          setCards(prev => [...prev, previewCard]);
          setPreviewCard(null);
          setSingleWord('');
          addXP(10);
          alert("Đã lưu thẻ vào danh sách học!");
      }
  };

  const handleStartQuiz = async () => {
    if (cards.length === 0) return;
    setLoading(true);
    try {
        const questions = await generateVocabularyQuiz(cards);
        setQuizQuestions(questions);
        setCurrentQuizIndex(0);
        setQuizScore(0);
        setSelectedOption(null);
        setQuizCompleted(false);
        setViewMode('quiz');
    } catch (error) {
        console.error(error);
        alert("Lỗi khi tạo bài trắc nghiệm.");
    } finally {
        setLoading(false);
    }
  };

  const handleNextCard = (mastered: boolean) => {
    if (mastered) {
      addXP(5);
    }
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
    } else {
      // Loop or finish
      if(confirm("Bạn đã học hết bộ từ vựng! Bạn có muốn làm bài kiểm tra không?")) {
        handleStartQuiz();
      } else {
        setCurrentIndex(0);
      }
    }
  };

  const handleAnswerQuiz = (option: string) => {
      if (selectedOption) return; // Prevent double click
      setSelectedOption(option);
      
      const isCorrect = option === quizQuestions[currentQuizIndex].correctAnswer;
      if (isCorrect) {
          setQuizScore(prev => prev + 1);
          addXP(5);
      }
  };

  const nextQuestion = () => {
      setSelectedOption(null);
      if (currentQuizIndex < quizQuestions.length - 1) {
          setCurrentQuizIndex(prev => prev + 1);
      } else {
          setQuizCompleted(true);
          addXP(quizScore * 5);
      }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // Helper to render a card
  const renderCardContent = (card: Flashcard, interactive = true) => (
      <div 
        className={`flip-card w-full max-w-md h-96 cursor-pointer group animate-pop-in ${isFlipped ? 'flipped' : ''}`}
        onClick={() => interactive && setIsFlipped(!isFlipped)}
      >
        <div className="flip-card-inner">
          <div className="flip-card-front">
            <ComicCard className="h-full flex flex-col items-center justify-center space-y-4 bg-paper hover:bg-white transition-colors" color="bg-paper">
                <span className="text-sm font-bold text-gray-400 font-sans uppercase">Tiếng Anh</span>
                <h3 className="text-4xl font-bold text-ink drop-shadow-sm">{card.word}</h3>
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full border border-gray-300 hover:scale-105 transition-transform">
                    <span className="font-mono text-gray-600">{card.pronunciation}</span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); speak(card.word); }}
                        className="p-1 hover:bg-white rounded-full transition-colors active:scale-90"
                    >
                        <Volume2 size={20} />
                    </button>
                </div>
                {interactive && <p className="text-gray-400 text-sm mt-8 font-sans animate-bounce-slow">(Chạm để lật)</p>}
            </ComicCard>
          </div>

          <div className="flip-card-back">
            <ComicCard className="h-full flex flex-col items-center justify-between bg-accent-yellow" color="bg-accent-yellow">
                <div className="flex-1 flex flex-col justify-center items-center space-y-6 px-4 text-center w-full">
                    <h3 className="text-3xl font-bold text-ink font-sans">{card.meaning}</h3>
                    <div className="bg-white/50 p-6 rounded-2xl border-2 border-black/10 w-full transform rotate-1 shadow-sm">
                        <p className="text-gray-800 italic font-hand text-2xl">"{card.example}"</p>
                    </div>
                </div>
                {interactive && <p className="text-gray-500 text-sm font-sans mb-4">(Chạm để xem lại)</p>}
            </ComicCard>
          </div>
        </div>
      </div>
  );

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-hand font-bold animate-slide-up">
            {viewMode === 'learn' ? 'Flashcard Thông Minh' : 'Đấu Trường Trắc Nghiệm'}
        </h2>
        <p className="text-gray-600 font-sans animate-slide-up delay-100">
            Học từ vựng với phương pháp lặp lại ngắt quãng và kiểm tra ngay.
        </p>
      </div>

      {/* Input Controls (Only visible in Learn mode and when no quiz active) */}
      {viewMode === 'learn' && !previewCard && cards.length === 0 && (
          <div className="w-full flex flex-col items-center gap-6">
            <div className="flex flex-wrap justify-center gap-4 animate-slide-up delay-150">
                <button 
                    onClick={() => { setInputMode('topic'); setInputValue(''); }}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold border-2 border-black transition-all ${inputMode === 'topic' ? 'bg-accent-blue shadow-comic -translate-y-1' : 'bg-white hover:bg-gray-50'}`}
                >
                    <Sparkles size={18}/> Theo Chủ Đề
                </button>
                <button 
                    onClick={() => { setInputMode('list'); setInputValue(''); }}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold border-2 border-black transition-all ${inputMode === 'list' ? 'bg-accent-yellow shadow-comic -translate-y-1' : 'bg-white hover:bg-gray-50'}`}
                >
                    <List size={18}/> Tự Nhập Từ
                </button>
                <button 
                    onClick={() => { setInputMode('single'); setSingleWord(''); }}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold border-2 border-black transition-all ${inputMode === 'single' ? 'bg-accent-pink shadow-comic -translate-y-1' : 'bg-white hover:bg-gray-50'}`}
                >
                    <PlusCircle size={18}/> Tạo Thẻ Đơn
                </button>
            </div>

            <div className="w-full max-w-2xl animate-slide-up delay-200">
                {inputMode === 'topic' && (
                    <ComicInput 
                        value={inputValue} 
                        onChange={(e) => setInputValue(e.target.value)} 
                        placeholder="Ví dụ: Động vật, Môi trường, Công nghệ..."
                    />
                )}
                
                {inputMode === 'list' && (
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Nhập các từ tiếng Anh, cách nhau bởi dấu phẩy hoặc xuống dòng (VD: apple, banana, environment)"
                        className="w-full p-4 border-2 border-black rounded-xl font-hand text-xl focus:outline-none focus:ring-4 focus:ring-accent-yellow shadow-sm h-32 resize-none"
                    />
                )}

                {inputMode === 'single' && (
                    <div className="space-y-4 bg-white p-6 rounded-2xl border-2 border-black shadow-comic">
                        <div>
                            <label className="block font-bold text-sm mb-1">Từ mới</label>
                            <ComicInput 
                                value={singleWord} 
                                onChange={(e) => setSingleWord(e.target.value)} 
                                placeholder="Nhập từ cần học (VD: Resilience)"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block font-bold text-sm mb-1">Chủ đề</label>
                                <select 
                                    className="w-full p-2 rounded-lg border-2 border-black font-hand"
                                    value={singleTopic}
                                    onChange={(e) => setSingleTopic(e.target.value)}
                                >
                                    <option value="Daily Life">Đời sống</option>
                                    <option value="School">Trường học</option>
                                    <option value="Science">Khoa học</option>
                                    <option value="Technology">Công nghệ</option>
                                    <option value="Travel">Du lịch</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-bold text-sm mb-1">Độ khó</label>
                                <select 
                                    className="w-full p-2 rounded-lg border-2 border-black font-hand"
                                    value={singleLevel}
                                    onChange={(e) => setSingleLevel(e.target.value as any)}
                                >
                                    <option value="easy">Dễ (Easy)</option>
                                    <option value="medium">Vừa (Medium)</option>
                                    <option value="hard">Khó (Hard)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-bold text-sm mb-1">Phong cách ảnh</label>
                                <select 
                                    className="w-full p-2 rounded-lg border-2 border-black font-hand"
                                    value={singleStyle}
                                    onChange={(e) => setSingleStyle(e.target.value as any)}
                                >
                                    <option value="hand_drawn">Vẽ tay (Hand Drawn)</option>
                                    <option value="cartoon">Hoạt hình (Cartoon)</option>
                                    <option value="realistic">Thực tế (Realistic)</option>
                                    <option value="minimal">Tối giản (Minimal)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="animate-slide-up delay-200">
                <ComicButton onClick={handleGenerate} disabled={loading}>
                    {loading ? <LoadingSpinner /> : (inputMode === 'single' ? '🎨 Tạo Flashcard' : '📚 Tạo Bộ Thẻ')}
                </ComicButton>
            </div>
          </div>
      )}

      {/* SINGLE CARD PREVIEW */}
      {previewCard && (
          <div className="flex flex-col items-center space-y-6 animate-pop-in">
              <h3 className="text-xl font-bold font-hand">Flashcard của bạn đã sẵn sàng!</h3>
              {renderCardContent(previewCard)}
              <div className="flex gap-4">
                  <ComicButton variant="secondary" onClick={() => setPreviewCard(null)}>
                     Hủy bỏ
                  </ComicButton>
                  <ComicButton onClick={handleSaveSingleCard}>
                     <div className="flex items-center gap-2"><Save size={18}/> Lưu vào bộ thẻ</div>
                  </ComicButton>
              </div>
          </div>
      )}

      {/* FLASHCARD LEARNING VIEW */}
      {!loading && viewMode === 'learn' && cards.length > 0 && (
        <div className="w-full flex flex-col items-center space-y-6 animate-slide-up">
          {/* Progress & Tools */}
          <div className="w-full flex justify-between items-center max-w-md">
             <span className="font-hand font-bold text-lg">{currentIndex + 1} / {cards.length}</span>
             <button 
                onClick={handleStartQuiz}
                className="flex items-center gap-2 text-sm font-bold text-black bg-accent-pink border-2 border-black px-4 py-2 rounded-full shadow-comic hover:shadow-comic-hover hover:-translate-y-0.5 transition-all"
             >
                <Brain size={16}/> Kiểm tra trắc nghiệm
             </button>
          </div>

          <div className="w-full max-w-md bg-white border-2 border-black rounded-full h-4 relative overflow-hidden">
            <div 
                className="bg-accent-green h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
            ></div>
          </div>

          {/* Render Current Card */}
          {renderCardContent(cards[currentIndex])}

          {/* Controls */}
          <div className="flex gap-4 mt-4 animate-slide-up delay-100">
             <ComicButton variant="danger" onClick={() => handleNextCard(false)}>
                <div className="flex items-center gap-2">
                    <XCircle size={20} /> Chưa thuộc
                </div>
             </ComicButton>
             <ComicButton variant="primary" onClick={() => handleNextCard(true)}>
                <div className="flex items-center gap-2">
                    <CheckCircle size={20} /> Đã thuộc
                </div>
             </ComicButton>
          </div>
        </div>
      )}

      {/* QUIZ VIEW */}
      {!loading && viewMode === 'quiz' && quizQuestions.length > 0 && (
          <div className="w-full max-w-2xl animate-slide-up">
              {!quizCompleted ? (
                  <div className="space-y-6">
                      <div className="flex justify-between items-center mb-4">
                          <span className="font-hand font-bold text-xl">Câu hỏi {currentQuizIndex + 1}/{quizQuestions.length}</span>
                          <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                              {quizQuestions[currentQuizIndex].difficulty}
                          </span>
                      </div>

                      <ComicCard className="p-8 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-2">
                              {/* Type Badge */}
                                <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded border border-gray-300">
                                    {quizQuestions[currentQuizIndex].type === 'meaning' && 'Từ vựng'}
                                    {quizQuestions[currentQuizIndex].type === 'fill-blank' && 'Điền từ'}
                                    {quizQuestions[currentQuizIndex].type === 'synonym' && 'Đồng nghĩa'}
                                    {quizQuestions[currentQuizIndex].type === 'antonym' && 'Trái nghĩa'}
                                </span>
                          </div>
                          
                          <h3 className="text-2xl font-bold font-sans mb-8 mt-2 text-center">
                              {quizQuestions[currentQuizIndex].question}
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {quizQuestions[currentQuizIndex].options.map((option, idx) => {
                                  let btnClass = "bg-white hover:bg-gray-50 border-gray-200";
                                  const isSelected = selectedOption === option;
                                  const isCorrect = option === quizQuestions[currentQuizIndex].correctAnswer;
                                  
                                  if (selectedOption) {
                                      if (isCorrect) btnClass = "bg-green-100 border-green-500 text-green-800";
                                      else if (isSelected) btnClass = "bg-red-100 border-red-500 text-red-800";
                                      else btnClass = "bg-gray-50 opacity-50";
                                  }

                                  return (
                                      <button 
                                        key={idx}
                                        onClick={() => handleAnswerQuiz(option)}
                                        disabled={!!selectedOption}
                                        className={`p-4 rounded-xl border-2 text-left font-bold transition-all ${btnClass} ${!selectedOption && 'hover:-translate-y-1 hover:shadow-md'}`}
                                      >
                                          {option}
                                      </button>
                                  )
                              })}
                          </div>

                          {selectedOption && (
                              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl animate-pop-in">
                                  <p className="font-bold text-blue-800 mb-1">💡 Giải thích:</p>
                                  <p className="text-blue-900">{quizQuestions[currentQuizIndex].explanation}</p>
                                  <div className="flex justify-end mt-2">
                                      <ComicButton onClick={nextQuestion}>
                                          {currentQuizIndex < quizQuestions.length - 1 ? 'Câu Tiếp Theo' : 'Xem Kết Quả'} <ArrowRight size={18} className="inline ml-1"/>
                                      </ComicButton>
                                  </div>
                              </div>
                          )}
                      </ComicCard>
                  </div>
              ) : (
                  <div className="text-center space-y-6 animate-pop-in">
                      <ComicCard className="py-12 bg-accent-yellow">
                          <h3 className="text-3xl font-hand font-bold mb-2">Kết Quả Bài Làm</h3>
                          <div className="text-6xl font-bold mb-4">{quizScore}/{quizQuestions.length}</div>
                          <p className="text-xl text-gray-700">
                              {quizScore === quizQuestions.length ? "Xuất sắc! Bạn là thiên tài! 🏆" : 
                               quizScore >= quizQuestions.length / 2 ? "Làm tốt lắm! Cố gắng thêm chút nữa nhé! 💪" : 
                               "Cần ôn tập thêm bạn nhé! 📚"}
                          </p>
                      </ComicCard>
                      
                      <div className="flex justify-center gap-4">
                          <ComicButton onClick={() => setViewMode('learn')}>
                             <RotateCcw size={18} className="inline mr-2"/> Học lại từ đầu
                          </ComicButton>
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};
