import { promises as fs } from 'fs';
import path from 'path';

interface SurveyAnswer {
  questionId: number;
  answer: string | number;
}

interface SurveySubmission {
  submissionId: string;
  groupId: string;
  answers: SurveyAnswer[];
  timestamp: string;
}

interface EmojiScaleResult {
  [key: string]: number;
}

interface TextInputResult {
  questionId: number;
  answers: string[];
}

export default async function AdminResultsPage() {
  // JSONファイルからデータを読み込み
  let submissions: SurveySubmission[] = [];
  
  try {
    const filePath = path.join(process.cwd(), 'data', 'survey_submissions.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    submissions = JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading survey submissions:', error);
    submissions = [];
  }

  // 全グループIDを抽出
  const allGroupIds = [...new Set(submissions.map(sub => sub.groupId))].sort();

  // 質問定義（フロントエンドと同じ）
  const questions = [
    {
      id: 1,
      type: 'emoji_scale' as const,
      text: "Overall, how satisfied are you at work?",
      options: [
        { value: 1, text: "全く思わない" },
        { value: 2, text: "あまり思わない" },
        { value: 3, text: "どちらとも言えない" },
        { value: 4, text: "そう思う" },
        { value: 5, text: "強くそう思う" },
      ]
    },
    {
      id: 2,
      type: 'text_input' as const,
      text: "チームとのコミュニケーションについて、具体的に改善できる点があれば教えてください。",
      placeholder: "ここに回答を入力してください..."
    }
  ];

  // データ集計関数
  const aggregateData = (filteredSubmissions: SurveySubmission[]) => {
    const emojiScaleResults: { [questionId: number]: EmojiScaleResult } = {};
    const textInputResults: { [questionId: number]: TextInputResult } = {};

    // 初期化
    questions.forEach(q => {
      if (q.type === 'emoji_scale') {
        emojiScaleResults[q.id] = {};
        q.options?.forEach(option => {
          emojiScaleResults[q.id][option.text] = 0;
        });
      } else if (q.type === 'text_input') {
        textInputResults[q.id] = { questionId: q.id, answers: [] };
      }
    });

    // データ集計
    filteredSubmissions.forEach(submission => {
      submission.answers.forEach(answer => {
        const question = questions.find(q => q.id === answer.questionId);
        
        if (question?.type === 'emoji_scale') {
          const option = question.options?.find(opt => opt.value === answer.answer);
          if (option) {
            emojiScaleResults[question.id][option.text]++;
          }
        } else if (question?.type === 'text_input') {
          if (typeof answer.answer === 'string' && answer.answer.trim()) {
            textInputResults[question.id].answers.push(answer.answer);
          }
        }
      });
    });

    return { emojiScaleResults, textInputResults };
  };

  // 全体の集計
  const { emojiScaleResults, textInputResults } = aggregateData(submissions);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            サーベイ結果管理画面
          </h1>
          
          <div className="mb-6">
            <label htmlFor="groupSelect" className="block text-sm font-medium text-gray-700 mb-2">
              グループ選択
            </label>
            <select
              id="groupSelect"
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors duration-200"
              defaultValue="all"
            >
              <option value="all">全てのグループ</option>
              {allGroupIds.map(groupId => (
                <option key={groupId} value={groupId}>{groupId}</option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="text-lg font-semibold text-blue-800">
              総回答数: {submissions.length} 件
            </div>
            <div className="text-sm text-blue-600">
              グループ数: {allGroupIds.length} グループ
            </div>
          </div>
        </div>

        {/* 絵文字スケール質問の集計結果 */}
        {questions.filter(q => q.type === 'emoji_scale').map(question => (
          <div key={question.id} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {question.text}
            </h2>
            
            <div className="space-y-3">
              {question.options?.map(option => {
                const count = emojiScaleResults[question.id]?.[option.text] || 0;
                const percentage = submissions.length > 0 
                  ? ((count / submissions.length) * 100).toFixed(1) 
                  : '0.0';
                
                return (
                  <div key={option.value} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-800">{option.text}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-800">{count} 件</div>
                      <div className="text-sm text-gray-500">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* テキスト入力質問の集計結果 */}
        {questions.filter(q => q.type === 'text_input').map(question => (
          <div key={question.id} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {question.text}
            </h2>
            
            <div className="space-y-3">
              {textInputResults[question.id]?.answers.length > 0 ? (
                textInputResults[question.id].answers.map((answer, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                    <p className="text-gray-800">{answer}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg text-gray-500 text-center">
                  回答がありません
                </div>
              )}
              
              <div className="mt-4 text-sm text-gray-600">
                回答数: {textInputResults[question.id]?.answers.length || 0} 件
              </div>
            </div>
          </div>
        ))}

        {/* データが存在しない場合 */}
        {submissions.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              データがありません
            </h2>
            <p className="text-gray-600">
              サーベイの回答データがまだ送信されていません。
            </p>
          </div>
        )}
      </div>

      {/* JavaScript for client-side filtering */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.getElementById('groupSelect').addEventListener('change', function() {
            const selectedGroup = this.value;
            // ここでクライアントサイドのフィルタリング処理を実装
            // 実際の実装では、選択されたグループに基づいてデータを再取得するか、
            // クライアントサイドでフィルタリングを行う
            console.log('Selected group:', selectedGroup);
          });
        `
      }} />
    </div>
  );
} 