import { promises as fs } from 'fs';
import path from 'path';
import SurveyClient from './SurveyClient';

interface EmojiOption {
  value: number;
  text: string;
  emoji: string;
}

interface Question {
  id: number;
  type: 'emoji_scale' | 'text_input';
  text: string;
  options?: EmojiOption[];
  placeholder?: string;
}

export default async function Home() {
  // JSONファイルから質問データを読み込み
  let questions: Question[] = [];
  
  try {
    const filePath = path.join(process.cwd(), 'data', 'survey_questions.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    questions = JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading survey questions:', error);
    // エラーが発生した場合はデフォルトの質問を使用
    questions = [
      {
        id: 1,
        type: 'emoji_scale' as const,
        text: "Overall, how satisfied are you at work?",
        options: [
          { value: 1, text: "Very dissatisfied", emoji: "😟" },
          { value: 2, text: "Dissatisfied", emoji: "🙁" },
          { value: 3, text: "Neutral", emoji: "😐" },
          { value: 4, text: "Satisfied", emoji: "🙂" },
          { value: 5, text: "Very satisfied", emoji: "😀" },
        ]
      },
      {
        id: 2,
        type: 'text_input' as const,
        text: "チームとのコミュニケーションについて、具体的に改善できる点があれば教えてください。",
        placeholder: "ここに回答を入力してください..."
      }
    ];
  }

  return <SurveyClient questions={questions} />;
}
