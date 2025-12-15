
export enum ModuleType {
  DASHBOARD = 'DASHBOARD',
  FLASHCARD = 'FLASHCARD',
  WRITING = 'WRITING',
  SPEAKING = 'SPEAKING',
  MINDMAP = 'MINDMAP',
}

export enum SpeakingMode {
  FREE = 'FREE',
  TOPIC = 'TOPIC',
  CHAT = 'CHAT',
}

export type FlashcardStyle = 'hand_drawn' | 'realistic' | 'cartoon' | 'minimal';
export type FlashcardLevel = 'easy' | 'medium' | 'hard';

export interface Flashcard {
  id: string;
  word: string;
  pronunciation: string;
  meaning: string;
  example: string;
  imageUrl?: string; // Optional, can be generated or placeholder
  status: 'new' | 'learning' | 'mastered';
  topic?: string;
  level?: FlashcardLevel;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  type: 'meaning' | 'fill-blank' | 'synonym' | 'antonym';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface WritingAnalysis {
  score: number;
  vocabScore: number;
  grammarScore: number;
  coherenceScore: number;
  feedback: string;
  correctedText: string;
  mistakes: Array<{
    original: string;
    correction: string;
    explanation: string;
  }>;
}

export interface SpeakingFeedback {
  transcript: string;
  score: number; // 0-10
  comment: string; // Nhận xét ngắn gọn
  mistakes: string[]; // Từ phát âm sai
  correction: string; // Câu gợi ý đúng hơn
  encouragement: string; // Lời động viên
}

export interface DialogueLine {
  id: string;
  speaker: 'Student' | 'AI';
  text: string;
  feedback?: SpeakingFeedback; // If student practiced this line
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  correction?: {
    original: string;
    fixed: string;
    explanation: string;
  };
}

export interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
  color?: string;
  note?: string; // Short description for the node
}

export type SummaryLength = 'short' | 'medium' | 'long';

export interface AnalysisOptions {
  summaryLength: SummaryLength;
  mode: 'both' | 'summary' | 'mindmap';
}

export interface ContentAnalysisResult {
  summary: string;
  keywords: string[];
  rootNode: MindMapNode | null; // Null if mode is summary only
}

export interface UserStats {
  xp: number;
  streak: number;
  level: number;
  badges: string[];
}
