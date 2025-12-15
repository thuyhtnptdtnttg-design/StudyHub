import React, { useState, useEffect } from 'react';
import { ModuleType, UserStats } from './types';
import { FlashcardModule } from './components/FlashcardModule';
import { WritingModule } from './components/WritingModule';
import { SpeakingModule } from './components/SpeakingModule';
import { MindmapModule } from './components/MindmapModule';
import { ComicButton } from './components/ui';
import { BookOpen, PenTool, Mic, BrainCircuit, User, Star, Menu } from 'lucide-react';

const App = () => {
  const [currentModule, setCurrentModule] = useState<ModuleType>(ModuleType.DASHBOARD);
  const [apiKey, setApiKey] = useState(process.env.API_KEY || '');
  const [stats, setStats] = useState<UserStats>({
    xp: 120,
    streak: 3,
    level: 2,
    badges: ['🚀 Khởi đầu', '📝 Cây bút vàng']
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Simple Gamification
  const addXP = (amount: number) => {
    setStats(prev => {
        const newXP = prev.xp + amount;
        const newLevel = Math.floor(newXP / 100) + 1;
        if (newLevel > prev.level) {
            alert(`🎉 Chúc mừng! Bạn đã lên Level ${newLevel}!`);
        }
        return { ...prev, xp: newXP, level: newLevel };
    });
  };

  const NavItem = ({ module, icon, label, color }: { module: ModuleType, icon: React.ReactNode, label: string, color: string }) => (
    <button
        onClick={() => {
            setCurrentModule(module);
            setIsMobileMenuOpen(false);
        }}
        className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all border-2 ${currentModule === module ? 'bg-white border-black shadow-comic' : 'border-transparent hover:bg-white/50 hover:translate-x-1'}`}
    >
        <div className={`p-2 rounded-lg border-2 border-black text-black ${color}`}>
            {icon}
        </div>
        <span className="font-hand font-bold text-lg text-ink">{label}</span>
    </button>
  );

  if (!apiKey) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-accent-yellow p-4 animate-fade-in">
              <div className="bg-white p-8 rounded-2xl border-4 border-black shadow-comic max-w-md w-full text-center space-y-4 animate-pop-in">
                  <h1 className="font-hand text-4xl font-bold">StudyHub</h1>
                  <p>Vui lòng cấu hình API KEY trong code (process.env.API_KEY) để bắt đầu.</p>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row font-sans text-ink">
      
      {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center p-4 bg-white border-b-2 border-black sticky top-0 z-50 shadow-sm">
        <h1 className="font-hand text-2xl font-bold">StudyHub 🚀</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="active:scale-95 transition-transform">
            <Menu size={28} />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed md:sticky top-0 h-screen w-64 bg-accent-yellow border-r-4 border-black p-6 flex flex-col justify-between z-40 transition-transform transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="space-y-8">
            <div className="hidden md:block">
                <h1 className="font-hand text-4xl font-bold mb-1 animate-wiggle inline-block origin-bottom-right">StudyHub</h1>
                <p className="text-sm font-bold text-gray-500">Trạm Học Siêu Tốc</p>
            </div>

            <nav className="space-y-2">
                <NavItem module={ModuleType.DASHBOARD} icon={<User size={20} />} label="Tổng quan" color="bg-white" />
                <NavItem module={ModuleType.FLASHCARD} icon={<BookOpen size={20} />} label="Flashcard" color="bg-accent-pink" />
                <NavItem module={ModuleType.WRITING} icon={<PenTool size={20} />} label="Chấm Viết" color="bg-accent-blue" />
                <NavItem module={ModuleType.SPEAKING} icon={<Mic size={20} />} label="Luyện Nói" color="bg-accent-green" />
                <NavItem module={ModuleType.MINDMAP} icon={<BrainCircuit size={20} />} label="Sơ Đồ Tư Duy" color="bg-white" />
            </nav>
        </div>

        {/* User Stats Mini Widget */}
        <div className="bg-white p-4 rounded-xl border-2 border-black shadow-comic animate-slide-up delay-300">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-gray-200 rounded-full border-2 border-black overflow-hidden">
                     <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
                </div>
                <div>
                    <p className="font-bold text-sm">Học Sinh Chăm Chỉ</p>
                    <p className="text-xs text-gray-500">Level {stats.level}</p>
                </div>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full border border-black overflow-hidden">
                <div className="bg-accent-blue h-full transition-all duration-1000 ease-out" style={{ width: `${(stats.xp % 100)}%` }}></div>
            </div>
            <p className="text-right text-xs font-bold mt-1">{stats.xp} XP</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen scrollbar-hide">
        <div key={currentModule} className="max-w-6xl mx-auto animate-fade-in">
            {currentModule === ModuleType.DASHBOARD && (
                <div className="space-y-8">
                    <header className="flex justify-between items-end animate-slide-up">
                        <div>
                            <h2 className="text-4xl font-hand font-bold">Xin chào, Học viên! 👋</h2>
                            <p className="text-gray-600">Hôm nay bạn muốn học gì nào?</p>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up delay-100">
                        <div className="bg-accent-blue p-6 rounded-2xl border-2 border-black shadow-comic hover:-translate-y-2 transition-transform duration-300">
                            <h3 className="font-bold text-xl mb-2">🔥 Streak</h3>
                            <p className="text-5xl font-hand font-bold">{stats.streak} <span className="text-xl">ngày</span></p>
                        </div>
                        <div className="bg-accent-pink p-6 rounded-2xl border-2 border-black shadow-comic hover:-translate-y-2 transition-transform duration-300">
                            <h3 className="font-bold text-xl mb-2">⭐ Tổng XP</h3>
                            <p className="text-5xl font-hand font-bold">{stats.xp}</p>
                        </div>
                        <div className="bg-accent-green p-6 rounded-2xl border-2 border-black shadow-comic hover:-translate-y-2 transition-transform duration-300">
                            <h3 className="font-bold text-xl mb-2">🏆 Huy Hiệu</h3>
                            <div className="flex flex-wrap gap-2">
                                {stats.badges.map((b, i) => (
                                    <span key={i} className="bg-white px-2 py-1 rounded-lg text-xs font-bold border border-black shadow-sm transform hover:scale-105 transition-transform">{b}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 animate-slide-up delay-200">
                        <button onClick={() => setCurrentModule(ModuleType.FLASHCARD)} className="group p-8 bg-white border-2 border-black rounded-2xl shadow-comic hover:shadow-comic-hover hover:-translate-y-1 transition-all text-left">
                            <div className="bg-accent-pink w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                <BookOpen size={24} />
                            </div>
                            <h3 className="text-2xl font-bold font-hand group-hover:text-pink-600 transition-colors">Học Từ Vựng</h3>
                            <p className="text-gray-500 mt-2">Tạo flashcard tự động theo chủ đề yêu thích của bạn.</p>
                        </button>
                        
                        <button onClick={() => setCurrentModule(ModuleType.WRITING)} className="group p-8 bg-white border-2 border-black rounded-2xl shadow-comic hover:shadow-comic-hover hover:-translate-y-1 transition-all text-left">
                            <div className="bg-accent-blue w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                                <PenTool size={24} />
                            </div>
                            <h3 className="text-2xl font-bold font-hand group-hover:text-blue-600 transition-colors">Chấm Bài Viết</h3>
                            <p className="text-gray-500 mt-2">Kiểm tra ngữ pháp và từ vựng cho bài luận.</p>
                        </button>

                         <button onClick={() => setCurrentModule(ModuleType.SPEAKING)} className="group p-8 bg-white border-2 border-black rounded-2xl shadow-comic hover:shadow-comic-hover hover:-translate-y-1 transition-all text-left">
                            <div className="bg-accent-green w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                <Mic size={24} />
                            </div>
                            <h3 className="text-2xl font-bold font-hand group-hover:text-green-600 transition-colors">Luyện Nói AI</h3>
                            <p className="text-gray-500 mt-2">Cải thiện phát âm và ngữ điệu ngay lập tức.</p>
                        </button>

                         <button onClick={() => setCurrentModule(ModuleType.MINDMAP)} className="group p-8 bg-white border-2 border-black rounded-2xl shadow-comic hover:shadow-comic-hover hover:-translate-y-1 transition-all text-left">
                            <div className="bg-purple-200 w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center mb-4 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                                <BrainCircuit size={24} />
                            </div>
                            <h3 className="text-2xl font-bold font-hand group-hover:text-purple-600 transition-colors">Tóm Tắt & Mindmap</h3>
                            <p className="text-gray-500 mt-2">Biến văn bản dài thành sơ đồ tư duy dễ nhớ.</p>
                        </button>
                    </div>
                </div>
            )}

            {currentModule === ModuleType.FLASHCARD && <FlashcardModule addXP={addXP} />}
            {currentModule === ModuleType.WRITING && <WritingModule addXP={addXP} />}
            {currentModule === ModuleType.SPEAKING && <SpeakingModule addXP={addXP} />}
            {currentModule === ModuleType.MINDMAP && <MindmapModule addXP={addXP} />}
        </div>
      </main>
    </div>
  );
};

export default App;