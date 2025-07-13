"use client";
import { useState, useEffect, useCallback } from "react";
import Link from 'next/link';

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

interface Message {
  type: 'success' | 'error';
  text: string;
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<Message | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  
  // 追加フォームの状態
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    type: 'emoji_scale',
    text: '',
    options: [{ value: 1, text: '' }],
    placeholder: ''
  });

  // 質問データを取得
  const fetchQuestions = useCallback(async () => {
    try {
      const response = await fetch('/api/questions');
      if (response.ok) {
        const data = await response.json();
        setQuestions(data);
      } else {
        throw new Error('Failed to fetch questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      showMessage('error', '質問データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  // メッセージ表示
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 初期ロード
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // 質問を追加
  const handleAddQuestion = async () => {
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion),
      });

      if (response.ok) {
        showMessage('success', '質問が追加されました');
        setShowAddForm(false);
        setNewQuestion({ type: 'emoji_scale', text: '', options: [{ value: 1, text: '' }], placeholder: '' });
        fetchQuestions();
      } else {
        const error = await response.json();
        throw new Error(error.error || '質問の追加に失敗しました');
      }
    } catch (error) {
      console.error('Error adding question:', error);
      showMessage('error', error instanceof Error ? error.message : '質問の追加に失敗しました');
    }
  };

  // 質問を更新
  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;

    try {
      const response = await fetch('/api/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingQuestion),
      });

      if (response.ok) {
        showMessage('success', '質問が更新されました');
        setEditingQuestion(null);
        fetchQuestions();
      } else {
        const error = await response.json();
        throw new Error(error.error || '質問の更新に失敗しました');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      showMessage('error', error instanceof Error ? error.message : '質問の更新に失敗しました');
    }
  };

  // 質問を削除
  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm('この質問を削除しますか？')) return;

    try {
      const response = await fetch(`/api/questions?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showMessage('success', '質問が削除されました');
        fetchQuestions();
      } else {
        const error = await response.json();
        throw new Error(error.error || '質問の削除に失敗しました');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      showMessage('error', error instanceof Error ? error.message : '質問の削除に失敗しました');
    }
  };

  // 選択肢を追加
  const addOption = () => {
    if (newQuestion.type === 'emoji_scale') {
      const newValue = (newQuestion.options?.length || 0) + 1;
      setNewQuestion(prev => ({
        ...prev,
        options: [...(prev.options || []), { value: newValue, text: '' }]
      }));
    }
  };

  // 選択肢を削除
  const removeOption = (index: number) => {
    if (newQuestion.type === 'emoji_scale' && newQuestion.options && newQuestion.options.length > 1) {
      setNewQuestion(prev => ({
        ...prev,
        options: prev.options?.filter((_, i) => i !== index)
      }));
    }
  };

  // 選択肢を更新
  const updateOption = (index: number, field: keyof EmojiOption, value: string | number) => {
    if (newQuestion.type === 'emoji_scale' && newQuestion.options) {
      const updatedOptions = [...newQuestion.options];
      updatedOptions[index] = { ...updatedOptions[index], [field]: value };
      setNewQuestion(prev => ({ ...prev, options: updatedOptions }));
    }
  };

  // 編集用の選択肢を更新
  const updateEditingOption = (index: number, field: keyof EmojiOption, value: string | number) => {
    if (editingQuestion?.type === 'emoji_scale' && editingQuestion.options) {
      const updatedOptions = [...editingQuestion.options];
      updatedOptions[index] = { ...updatedOptions[index], [field]: value };
      setEditingQuestion(prev => prev ? { ...prev, options: updatedOptions } : null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">
              サーベイ質問管理画面
            </h1>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              {showAddForm ? 'キャンセル' : '質問を追加'}
            </button>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-lg font-semibold text-blue-800">
              質問数: {questions.length} 件
            </div>
            <div className="text-sm text-blue-600">
              絵文字スケール: {questions.filter(q => q.type === 'emoji_scale').length} 件
            </div>
            <div className="text-sm text-blue-600">
              テキスト入力: {questions.filter(q => q.type === 'text_input').length} 件
            </div>
          </div>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* 追加フォーム */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">新しい質問を追加</h2>
            
            <div className="space-y-4">
              {/* 質問タイプ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">質問タイプ</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="emoji_scale"
                      checked={newQuestion.type === 'emoji_scale'}
                      onChange={(e) => setNewQuestion(prev => ({ 
                        ...prev, 
                        type: e.target.value as 'emoji_scale',
                        options: [{ value: 1, text: '', emoji: '😟' }]
                      }))}
                      className="mr-2"
                    />
                    絵文字スケール
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="text_input"
                      checked={newQuestion.type === 'text_input'}
                      onChange={(e) => setNewQuestion(prev => ({ 
                        ...prev, 
                        type: e.target.value as 'text_input',
                        placeholder: ''
                      }))}
                      className="mr-2"
                    />
                    テキスト入力
                  </label>
                </div>
              </div>

              {/* 質問文 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">質問文</label>
                <input
                  type="text"
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="質問を入力してください"
                />
              </div>

              {/* 絵文字スケールの選択肢 */}
              {newQuestion.type === 'emoji_scale' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">選択肢</label>
                  <div className="space-y-3">
                                         {newQuestion.options?.map((option, index) => (
                       <div key={index} className="flex gap-3 items-center">
                         <input
                           type="text"
                           value={option.text}
                           onChange={(e) => updateOption(index, 'text', e.target.value)}
                           className="flex-1 p-2 border-2 border-gray-200 rounded-lg text-gray-800"
                           placeholder="選択肢のテキスト"
                         />
                         <input
                           type="number"
                           value={option.value}
                           onChange={(e) => updateOption(index, 'value', parseInt(e.target.value))}
                           className="w-20 p-2 border-2 border-gray-200 rounded-lg text-center text-gray-800"
                         />
                         {newQuestion.options && newQuestion.options.length > 1 && (
                           <button
                             onClick={() => removeOption(index)}
                             className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                           >
                             削除
                           </button>
                         )}
                       </div>
                     ))}
                    <button
                      onClick={addOption}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      選択肢を追加
                    </button>
                  </div>
                </div>
              )}

              {/* テキスト入力のプレースホルダー */}
              {newQuestion.type === 'text_input' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">プレースホルダー</label>
                  <input
                    type="text"
                    value={newQuestion.placeholder}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, placeholder: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="プレースホルダーを入力してください"
                  />
                </div>
              )}

              {/* 追加ボタン */}
              <div className="flex gap-4">
                                 <button
                   onClick={handleAddQuestion}
                   disabled={!newQuestion.text?.trim()}
                   className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                 >
                   質問を追加
                 </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 質問リスト */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
              {editingQuestion?.id === question.id ? (
                /* 編集モード */
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">質問を編集</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">質問タイプ</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="emoji_scale"
                          checked={editingQuestion.type === 'emoji_scale'}
                          onChange={(e) => setEditingQuestion(prev => prev ? { 
                            ...prev, 
                            type: e.target.value as 'emoji_scale',
                            options: prev.options || [{ value: 1, text: '', emoji: '😟' }]
                          } : null)}
                          className="mr-2"
                        />
                        絵文字スケール
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="text_input"
                          checked={editingQuestion.type === 'text_input'}
                          onChange={(e) => setEditingQuestion(prev => prev ? { 
                            ...prev, 
                            type: e.target.value as 'text_input',
                            placeholder: prev.placeholder || ''
                          } : null)}
                          className="mr-2"
                        />
                        テキスト入力
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">質問文</label>
                    <input
                      type="text"
                      value={editingQuestion.text}
                      onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, text: e.target.value } : null)}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {editingQuestion.type === 'emoji_scale' && editingQuestion.options && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">選択肢</label>
                      <div className="space-y-3">
                                                 {editingQuestion.options.map((option, optionIndex) => (
                           <div key={optionIndex} className="flex gap-3 items-center">
                             <input
                               type="text"
                               value={option.text}
                               onChange={(e) => updateEditingOption(optionIndex, 'text', e.target.value)}
                               className="flex-1 p-2 border-2 border-gray-200 rounded-lg text-gray-800"
                             />
                             <input
                               type="number"
                               value={option.value}
                               onChange={(e) => updateEditingOption(optionIndex, 'value', parseInt(e.target.value))}
                               className="w-20 p-2 border-2 border-gray-200 rounded-lg text-center text-gray-800"
                             />
                           </div>
                         ))}
                      </div>
                    </div>
                  )}

                  {editingQuestion.type === 'text_input' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">プレースホルダー</label>
                      <input
                        type="text"
                        value={editingQuestion.placeholder}
                        onChange={(e) => setEditingQuestion(prev => prev ? { ...prev, placeholder: e.target.value } : null)}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={handleUpdateQuestion}
                      disabled={!editingQuestion.text.trim()}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      更新
                    </button>
                    <button
                      onClick={() => setEditingQuestion(null)}
                      className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                /* 表示モード */
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">
                          {question.text}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            question.type === 'emoji_scale' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {question.type === 'emoji_scale' ? '絵文字スケール' : 'テキスト入力'}
                          </span>
                          <span className="text-sm text-gray-500">ID: {question.id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingQuestion(question)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                      >
                        削除
                      </button>
                    </div>
                  </div>

                  {/* 絵文字スケールの選択肢表示 */}
                  {question.type === 'emoji_scale' && question.options && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">選択肢:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {question.options.map(option => (
                          <div key={option.value} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-800">{option.text}</div>
                              <div className="text-sm text-gray-500">値: {option.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* テキスト入力のプレースホルダー表示 */}
                  {question.type === 'text_input' && question.placeholder && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">プレースホルダー:</h3>
                      <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-purple-500">
                        <p className="text-gray-600 italic">&quot;{question.placeholder}&quot;</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* データが存在しない場合 */}
        {questions.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl mb-4">❓</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              質問データがありません
            </h2>
            <p className="text-gray-600">
              サーベイの質問データがまだ設定されていません。
            </p>
          </div>
        )}

        {/* ナビゲーション */}
        <div className="mt-8 flex gap-4">
          <Link 
            href="/admin/results" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
          >
            結果画面へ
          </Link>
          <Link 
            href="/" 
            className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors duration-200"
          >
            サーベイ画面へ
          </Link>
        </div>
      </div>
    </div>
  );
} 