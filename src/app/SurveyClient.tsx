"use client";
import { useState } from "react";

interface EmojiOption {
  value: number;
  text: string;
}

interface Question {
  id: number;
  type: 'emoji_scale' | 'text_input';
  text: string;
  options?: EmojiOption[];
  placeholder?: string;
}

interface Answers {
  [key: number]: string | number;
}

interface SurveyClientProps {
  questions: Question[];
}

export default function SurveyClient({ questions }: SurveyClientProps) {
  const [groupId, setGroupId] = useState("");
  const [isSurveyStarted, setIsSurveyStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleStartSurvey = () => {
    if (groupId.trim()) {
      setIsSurveyStarted(true);
    }
  };

  const handleAnswerChange = (value: string | number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setIsCompleted(true);
      console.log("Survey completed! All answers:", answers);
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const canProceed = () => {
    const currentAnswer = answers[currentQuestion.id];
    if (currentQuestion.type === 'text_input') {
      return currentAnswer && String(currentAnswer).trim().length > 0;
    }
    return currentAnswer !== undefined;
  };

  const handleSubmitSurvey = async () => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // 回答データをAPI用の形式に変換
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        answer: answer
      }));

      const submissionData = {
        submissionId: crypto.randomUUID(),
        groupId: groupId,
        answers: answersArray,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/submit-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        setSubmitMessage({
          type: 'success',
          text: '回答が正常に送信されました！ありがとうございます。'
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '送信に失敗しました');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      setSubmitMessage({
        type: 'error',
        text: '回答の送信に失敗しました。もう一度お試しください。'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = () => {
    if (currentQuestion.type === 'emoji_scale') {
      return (
        <div className="flex flex-col gap-3 mb-8">
          {currentQuestion.options?.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswerChange(option.value)}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 ${
                answers[currentQuestion.id] === option.value
                  ? "border-[#C4E0F4] bg-[#C4E0F4] shadow-md"
                  : "border-gray-200 hover:border-[#C4E0F4] hover:bg-[#F7E5D9]"
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="font-medium text-gray-800">{option.text}</span>
              </div>
            </button>
          ))}
        </div>
      );
    }

    if (currentQuestion.type === 'text_input') {
      return (
        <div className="mb-8">
          <textarea
            value={answers[currentQuestion.id] as string || ""}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder={currentQuestion.placeholder}
            className="w-full p-4 border-2 border-gray-200 rounded-lg resize-none focus:border-[#C4E0F4] focus:outline-none transition-colors duration-200 text-black"
            rows={4}
          />
        </div>
      );
    }

    return null;
  };

  // グループID入力画面
  if (!isSurveyStarted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#F7E5D9] p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">📊</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              CRAZY SURVEY
            </h1>
            <p className="text-gray-600">
              あなたのグループIDを入力してサーベイを開始してください
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="groupId" className="block text-sm font-medium text-gray-700 mb-2">
              グループID
            </label>
            <input
              type="text"
              id="groupId"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              placeholder="例: グループA, チームB, 部署C"
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-[#C4E0F4] focus:outline-none transition-colors duration-200 text-black"
            />
          </div>

          <button
            onClick={handleStartSurvey}
            disabled={!groupId.trim()}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
              groupId.trim()
                ? "bg-[#C4E0F4] text-gray-800 hover:bg-[#A8D4F0] shadow-md"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            サーベイを開始
          </button>
        </div>
      </main>
    );
  }

  // 導入文章表示画面
  if (isSurveyStarted && currentQuestionIndex === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#F7E5D9] p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">📊</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              CRAZY SURVEY
            </h1>
            <p className="text-gray-600 mb-4">
              グループID: <span className="font-semibold">{groupId}</span>
            </p>
          </div>

          <div className="mb-6 p-4 bg-[#F7E5D9] rounded-lg">
            <h2 className="text-lg font-bold text-gray-800 mb-3">＜ご案内＞</h2>
            <p className="text-gray-700 text-sm leading-relaxed">
              このサーベイは、皆さんが日々の仕事の中で感じていること、そして「もっとこうなったら最高！」という想いを共有していただくためのものです。会社が一方的に「こうあるべき」と求めるのではなく、皆さんの声を通じて、会社も個人も共に成長し、お客様に最高の感動を届けられるチームを創っていくことを目指しています。率直なご意見をお聞かせください。
            </p>
          </div>

          <button
            onClick={() => setCurrentQuestionIndex(1)}
            className="w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 bg-[#C4E0F4] text-gray-800 hover:bg-[#A8D4F0] shadow-md"
          >
            次へ
          </button>
        </div>
      </main>
    );
  }

  if (isCompleted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#F7E5D9] p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-xl font-bold mb-4 text-gray-800">
            サーベイ完了！ご協力ありがとうございました！
          </h1>
          <p className="text-gray-600 mb-2">
            グループID: <span className="font-semibold">{groupId}</span>
          </p>
          <p className="text-gray-600 mb-6">
            お客様の貴重なご意見を今後の改善に活用させていただきます。
          </p>
          
          <button
            onClick={handleSubmitSurvey}
            disabled={isSubmitting}
            className={`w-full py-3 px-6 rounded-lg font-medium transition-colors duration-200 shadow-md mb-4 ${
              isSubmitting
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-[#C4E0F4] text-gray-800 hover:bg-[#A8D4F0]"
            }`}
          >
            {isSubmitting ? "送信中..." : "回答を送信"}
          </button>

          {submitMessage && (
            <div className={`p-4 rounded-lg ${
              submitMessage.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {submitMessage.text}
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F7E5D9] p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>質問 {currentQuestionIndex} / {questions.length}</span>
            <span>{Math.round((currentQuestionIndex / questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#C4E0F4] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentQuestionIndex / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="mb-4 text-center">
          <span className="text-sm text-gray-500">グループID: {groupId}</span>
        </div>

        <h1 className="text-xl font-bold mb-8 text-center text-gray-800">
          {currentQuestion.text}
        </h1>
        
        {renderQuestion()}

        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
            canProceed()
              ? "bg-[#C4E0F4] text-gray-800 hover:bg-[#A8D4F0] shadow-md"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isLastQuestion ? "完了" : "次へ"}
        </button>
      </div>
    </main>
  );
} 