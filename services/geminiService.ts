
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Flashcard, WritingAnalysis, SpeakingFeedback, ContentAnalysisResult, AnalysisOptions, DialogueLine, ChatMessage, QuizQuestion, FlashcardLevel, FlashcardStyle } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

// --- FLASHCARD GENERATION ---

export const createSingleFlashcard = async (
    word: string, 
    topic: string, 
    level: FlashcardLevel, 
    style: FlashcardStyle
): Promise<Flashcard> => {
    const ai = getAI();

    // 1. Generate Text Content
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            word: { type: Type.STRING },
            phonetic: { type: Type.STRING },
            meaning: { type: Type.STRING },
            example: { type: Type.STRING },
            imagePrompt: { type: Type.STRING, description: "A simple English description of the image to illustrate the word." }
        },
        required: ["word", "phonetic", "meaning", "example", "imagePrompt"]
    };

    const prompt = `
    You are an English teacher for Vietnamese high school students.
    Create flashcard content for the word: "${word}"
    Topic: ${topic}
    Level: ${level}

    Requirements:
    - Give IPA phonetic transcription.
    - Vietnamese meaning (simple, easy to understand).
    - One simple English example sentence.
    - The example must match the image meaning.
    - Language must be suitable for ${level} level students.
    
    Return in JSON.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    const data = JSON.parse(response.text || "{}");

    // 2. Generate Image URL (using Pollinations.ai)
    // We construct a specific prompt based on the style
    let stylePrompt = "";
    switch (style) {
        case 'hand_drawn': stylePrompt = "hand drawn sketch, pencil style, doodle, educational, white background"; break;
        case 'cartoon': stylePrompt = "cute cartoon, flat design, colorful, vector art, simple"; break;
        case 'realistic': stylePrompt = "realistic photography, high quality, 4k"; break;
        case 'minimal': stylePrompt = "minimalist icon, line art, simple, clean"; break;
        default: stylePrompt = "educational illustration";
    }

    const fullImagePrompt = `${data.imagePrompt}, ${stylePrompt}, no text, no letters`;
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullImagePrompt)}?width=400&height=300&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;

    return {
        id: `fc-single-${Date.now()}`,
        word: data.word,
        pronunciation: data.phonetic,
        meaning: data.meaning,
        example: data.example,
        imageUrl: imageUrl,
        status: 'new',
        topic: topic,
        level: level
    };
};

export const generateFlashcards = async (mode: 'topic' | 'list', input: string): Promise<Flashcard[]> => {
  const ai = getAI();
  
  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        word: { type: Type.STRING },
        pronunciation: { type: Type.STRING },
        meaning: { type: Type.STRING },
        example: { type: Type.STRING },
        imageKeyword: { type: Type.STRING, description: "A SINGLE, concrete English noun that visually represents this word for image search (e.g. 'cat', 'forest', 'running'). Do not use abstract concepts." }
      },
      required: ["word", "pronunciation", "meaning", "example", "imageKeyword"]
    }
  };

  let prompt = "";
  if (mode === 'topic') {
      prompt = `Tạo 5 từ vựng tiếng Anh liên quan đến chủ đề: "${input}". 
      Phản hồi bằng JSON.
      YÊU CẦU QUAN TRỌNG:
      1. 'meaning': Nghĩa phải là tiếng Việt.
      2. 'example': Câu ví dụ bắt buộc phải là TIẾNG ANH (English).
      3. 'imageKeyword': Từ khóa tìm ảnh phải là danh từ cụ thể trong tiếng Anh (English noun) để minh họa sát nghĩa nhất.`;
  } else {
      prompt = `Tôi có danh sách các từ vựng sau: "${input}".
      Hãy tạo thông tin chi tiết cho từng từ.
      YÊU CẦU QUAN TRỌNG:
      1. 'meaning': Nghĩa phải là tiếng Việt.
      2. 'example': Câu ví dụ bắt buộc phải là TIẾNG ANH (English).
      3. 'imageKeyword': Từ khóa tìm ảnh phải là danh từ cụ thể trong tiếng Anh (English noun) để minh họa sát nghĩa nhất.
      Nếu từ vựng sai chính tả, hãy tự sửa lại cho đúng.
      Phản hồi bằng JSON.`;
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      systemInstruction: "Bạn là trợ lý học tập. Hãy chắc chắn ví dụ là tiếng Anh và nghĩa là tiếng Việt."
    }
  });

  const data = JSON.parse(response.text || "[]");
  
  return data.map((item: any, index: number) => ({
    id: `fc-${Date.now()}-${index}`,
    word: item.word,
    pronunciation: item.pronunciation,
    meaning: item.meaning,
    example: item.example,
    // Use Pollinations.ai for AI-generated images based on the keyword for better relevance
    imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(item.imageKeyword)}?width=400&height=300&nologo=true`, 
    status: 'new'
  }));
};

export const generateVocabularyQuiz = async (words: Flashcard[]): Promise<QuizQuestion[]> => {
  const ai = getAI();
  const wordList = words.map(w => `${w.word} (${w.meaning})`).join(", ");

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        question: { type: Type.STRING },
        options: { type: Type.ARRAY, items: { type: Type.STRING } },
        correctAnswer: { type: Type.STRING },
        explanation: { type: Type.STRING, description: "Giải thích ngắn gọn tại sao đúng bằng tiếng Việt" },
        type: { type: Type.STRING, enum: ["meaning", "fill-blank", "synonym", "antonym"] },
        difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] }
      },
      required: ["id", "question", "options", "correctAnswer", "explanation", "type", "difficulty"]
    }
  };

  const prompt = `Dựa trên danh sách từ vựng sau: ${wordList}.
  Hãy tạo ra 5 câu hỏi trắc nghiệm để kiểm tra học sinh.
  
  Yêu cầu phân bổ độ khó:
  - 2 câu Dễ (Easy): Hỏi về nghĩa của từ (Tiếng Anh -> Tiếng Việt hoặc ngược lại).
  - 2 câu Trung bình (Medium): Điền từ vào chỗ trống trong câu tiếng Anh (Fill in the blank).
  - 1 câu Khó (Hard): Tìm từ đồng nghĩa (Synonym) hoặc trái nghĩa (Antonym) hoặc câu hỏi ngữ cảnh nâng cao.
  
  Mỗi câu hỏi phải có 4 đáp án lựa chọn.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  return JSON.parse(response.text || "[]");
};

// --- WRITING CORRECTION ---
export const analyzeWriting = async (mode: 'text' | 'image', content: string): Promise<WritingAnalysis> => {
  const ai = getAI();
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER, description: "Overall score 0-10" },
      vocabScore: { type: Type.NUMBER },
      grammarScore: { type: Type.NUMBER },
      coherenceScore: { type: Type.NUMBER },
      feedback: { type: Type.STRING, description: "Detailed feedback in Vietnamese, encouraging tone." },
      correctedText: { type: Type.STRING },
      mistakes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            original: { type: Type.STRING },
            correction: { type: Type.STRING },
            explanation: { type: Type.STRING, description: "Explanation in Vietnamese" }
          },
          required: ["original", "correction", "explanation"]
        }
      }
    },
    required: ["score", "vocabScore", "grammarScore", "coherenceScore", "feedback", "correctedText", "mistakes"]
  };

  const parts = [];
  if (mode === 'image') {
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: content } });
      parts.push({ text: `Hãy nhìn hình ảnh này, nhận diện chữ viết tay (hoặc văn bản) trong đó.
      Sau đó chấm điểm bài viết tiếng Anh đó theo chuẩn học sinh THPT / IELTS cơ bản.` });
  } else {
      parts.push({ text: `Chấm điểm đoạn văn tiếng Anh sau theo chuẩn học sinh THPT / IELTS cơ bản: \n\n"${content}"` });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      systemInstruction: "Bạn là giáo viên tiếng Anh tận tâm. Hãy chấm điểm, chỉ ra lỗi sai và viết lại câu cho hay hơn. Phản hồi bằng tiếng Việt."
    }
  });

  return JSON.parse(response.text || "{}");
};

// --- SPEAKING: MODE 1 (FREE TALK) ---
export const analyzeFreeSpeaking = async (audioBase64: string): Promise<SpeakingFeedback> => {
  const ai = getAI();
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
        transcript: { type: Type.STRING },
        score: { type: Type.NUMBER, description: "Score 0-10" },
        comment: { type: Type.STRING, description: "Short, friendly comment in Vietnamese" },
        mistakes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of mispronounced words" },
        correction: { type: Type.STRING, description: "A better, more natural sentence" },
        encouragement: { type: Type.STRING, description: "Encouraging closing words in Vietnamese" }
    },
    required: ["transcript", "score", "comment", "mistakes", "correction", "encouragement"]
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash", 
    contents: {
        parts: [
            { inlineData: { mimeType: "audio/wav", data: audioBase64 } },
            { text: `Nghe giọng nói học sinh và thực hiện:
            1. Viết lại transcript tiếng Anh.
            2. Chấm điểm phát âm (thang 10).
            3. Nhận xét ngắn gọn, dễ hiểu (Tiếng Việt).
            4. Chỉ ra các từ phát âm sai.
            5. Viết lại câu nói đúng, tự nhiên hơn.
            6. Động viên học sinh bằng lời khích lệ vui vẻ.` }
        ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      systemInstruction: "Bạn là AI thân thiện, động viên học sinh THPT. Dùng ngôn ngữ teen code một chút cũng được nhưng phải lịch sự."
    }
  });

  return JSON.parse(response.text || "{}");
};

// --- SPEAKING: MODE 2 (TOPIC DIALOGUE) ---
export const generateDialogue = async (topic: string): Promise<DialogueLine[]> => {
    const ai = getAI();

    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                speaker: { type: Type.STRING, enum: ["Student", "AI"] },
                text: { type: Type.STRING }
            },
            required: ["speaker", "text"]
        }
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Tạo một đoạn hội thoại ngắn (6-8 câu) hoàn toàn bằng TIẾNG ANH (English) về chủ đề: "${topic}".
        Phân vai: "Student" và "AI".
        Câu ngắn gọn, từ vựng phù hợp học sinh THPT.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    const data = JSON.parse(response.text || "[]");
    return data.map((item: any, idx: number) => ({
        id: `dlg-${idx}`,
        speaker: item.speaker,
        text: item.text
    }));
};

export const assessDialogueLine = async (audioBase64: string, targetText: string): Promise<SpeakingFeedback> => {
    const ai = getAI();
    
    // Re-use similar schema to free speaking but context is specific
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            transcript: { type: Type.STRING },
            score: { type: Type.NUMBER },
            comment: { type: Type.STRING },
            mistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
            correction: { type: Type.STRING },
            encouragement: { type: Type.STRING }
        },
        required: ["transcript", "score", "comment", "mistakes", "correction", "encouragement"]
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                { inlineData: { mimeType: "audio/wav", data: audioBase64 } },
                { text: `Học sinh cần nói câu: "${targetText}".
                Hãy nghe và so sánh.
                Chấm điểm độ chính xác.
                Chỉ ra lỗi sai nếu có.` }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    return JSON.parse(response.text || "{}");
};

// --- SPEAKING: MODE 3 (FRIENDLY CHAT) ---
export const chatWithFriend = async (audioBase64: string, history: ChatMessage[]): Promise<{ userTranscript: string, reply: string, correction?: { original: string, fixed: string, explanation: string } }> => {
    const ai = getAI();

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            userTranscript: { type: Type.STRING },
            reply: { type: Type.STRING, description: "Friendly reply to the conversation" },
            correction: { 
                type: Type.OBJECT, 
                properties: {
                    original: { type: Type.STRING },
                    fixed: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                nullable: true,
                description: "Correction of the user's grammar/vocab if needed."
            }
        },
        required: ["userTranscript", "reply"]
    };

    const historyText = history.map(h => `${h.sender}: ${h.text}`).join("\n");

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                { inlineData: { mimeType: "audio/wav", data: audioBase64 } },
                { text: `Bạn là một người bạn quốc tế thân thiện. Hãy nghe người dùng nói, viết lại transcript.
                Sau đó trả lời tiếp câu chuyện một cách tự nhiên (bằng tiếng Anh).
                Nếu người dùng nói sai ngữ pháp hoặc từ vựng nghiêm trọng, hãy đưa ra gợi ý sửa lỗi nhẹ nhàng (bằng tiếng Việt) trong phần 'correction'.
                Nếu không có lỗi, phần 'correction' để null.
                
                Lịch sử chat:
                ${historyText}` }
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            systemInstruction: "Giọng điệu vui vẻ, như bạn bè trang lứa."
        }
    });

    const data = JSON.parse(response.text || "{}");
    return data;
};

// --- CONTENT ANALYSIS & SUMMARY ---
export const generateContentAnalysis = async (
    inputData: { type: 'text' | 'image', content: string },
    options: AnalysisOptions
): Promise<ContentAnalysisResult> => {
  const ai = getAI();

  // Recursive Schema for Mindmap
  const nodeSchema: Schema = {
    type: Type.OBJECT,
    properties: {
       id: { type: Type.STRING },
       label: { type: Type.STRING },
       note: { type: Type.STRING, description: "Mô tả ngắn gọn ý này (5-10 từ)" },
       color: { type: Type.STRING },
       children: {
           type: Type.ARRAY,
           items: {
             type: Type.OBJECT, 
             properties: { 
               id: { type: Type.STRING },
               label: { type: Type.STRING },
               note: { type: Type.STRING },
               color: { type: Type.STRING },
               children: {
                  type: Type.ARRAY,
                  items: { 
                     type: Type.OBJECT,
                     properties: {
                        id: { type: Type.STRING },
                        label: { type: Type.STRING },
                        color: { type: Type.STRING }
                     }
                  }
               }
             }
           }
       }
    },
    required: ["id", "label", "children", "color"]
  };

  const mainSchema: Schema = {
      type: Type.OBJECT,
      properties: {
          summary: { type: Type.STRING },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          rootNode: { ...nodeSchema, nullable: true }
      },
      required: ["summary", "keywords"]
  };

  const parts = [];
  const lengthPrompt = options.summaryLength === 'short' ? '30-50 từ (Ngắn gọn)' : 
                       options.summaryLength === 'medium' ? '80-120 từ (Vừa phải)' : 
                       '180-250 từ (Chi tiết)';

  const systemTask = `
    Nhiệm vụ của bạn là trợ lý học tập. Hãy phân tích nội dung đầu vào.
    1. TÓM TẮT: Viết một đoạn tóm tắt rõ ràng, dễ hiểu cho học sinh THPT. Độ dài: ${lengthPrompt}.
    2. TỪ KHÓA: Trích xuất 3-5 từ khóa quan trọng nhất.
    ${options.mode !== 'summary' ? `3. SƠ ĐỒ TƯ DUY: Tạo cấu trúc cây (JSON) cho sơ đồ tư duy với 1 chủ đề chính và 4-6 nhánh phụ.` : `3. Sơ đồ tư duy: Đặt là null.`}
  `;

  if (inputData.type === 'image') {
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: inputData.content } });
      parts.push({ text: systemTask });
  } else {
      parts.push({ text: `Nội dung: "${inputData.content}". \n\n ${systemTask}` });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: { parts: parts },
    config: {
        responseMimeType: "application/json",
        responseSchema: mainSchema
    }
  });

  return JSON.parse(response.text || "{}");
};
