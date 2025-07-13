import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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

// 質問データファイルのパスを取得
const getQuestionsFilePath = () => {
  return path.join(process.cwd(), 'data', 'survey_questions.json');
};

// 質問データを読み込む
const loadQuestions = async (): Promise<Question[]> => {
  try {
    const filePath = getQuestionsFilePath();
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch {
    // ファイルが存在しない場合は空配列を返す
    return [];
  }
};

// 質問データを保存する
const saveQuestions = async (questions: Question[]): Promise<void> => {
  const filePath = getQuestionsFilePath();
  const dataDirectory = path.dirname(filePath);
  
  // データディレクトリが存在しない場合は作成
  try {
    await fs.access(dataDirectory);
  } catch {
    await fs.mkdir(dataDirectory, { recursive: true });
  }
  
  await fs.writeFile(filePath, JSON.stringify(questions, null, 2), 'utf-8');
};

// 新しいIDを生成する
const generateNewId = (questions: Question[]): number => {
  if (questions.length === 0) return 1;
  const maxId = Math.max(...questions.map(q => q.id));
  return maxId + 1;
};

// GET: 全ての質問データを取得
export async function GET() {
  try {
    const questions = await loadQuestions();
    return NextResponse.json(questions);
  } catch (_error) {
    console.error('Error loading questions:', _error);
    return NextResponse.json(
      { error: 'Failed to load questions' },
      { status: 500 }
    );
  }
}

// POST: 新しい質問を追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    if (!body.text || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: text and type' },
        { status: 400 }
      );
    }

    if (!['emoji_scale', 'text_input'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid question type. Must be "emoji_scale" or "text_input"' },
        { status: 400 }
      );
    }

    // 絵文字スケールの場合は選択肢が必要
    if (body.type === 'emoji_scale' && (!body.options || !Array.isArray(body.options) || body.options.length === 0)) {
      return NextResponse.json(
        { error: 'Emoji scale questions must have options' },
        { status: 400 }
      );
    }

    const questions = await loadQuestions();
    const newQuestion: Question = {
      ...body,
      id: generateNewId(questions)
    };

    questions.push(newQuestion);
    await saveQuestions(questions);

    return NextResponse.json(newQuestion, { status: 201 });
  } catch (_error) {
    console.error('Error creating question:', _error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}

// PUT: 質問を更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    if (!body.id || !body.text || !body.type) {
      return NextResponse.json(
        { error: 'Missing required fields: id, text, and type' },
        { status: 400 }
      );
    }

    if (!['emoji_scale', 'text_input'].includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid question type. Must be "emoji_scale" or "text_input"' },
        { status: 400 }
      );
    }

    // 絵文字スケールの場合は選択肢が必要
    if (body.type === 'emoji_scale' && (!body.options || !Array.isArray(body.options) || body.options.length === 0)) {
      return NextResponse.json(
        { error: 'Emoji scale questions must have options' },
        { status: 400 }
      );
    }

    const questions = await loadQuestions();
    const questionIndex = questions.findIndex(q => q.id === body.id);

    if (questionIndex === -1) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // 質問を更新
    questions[questionIndex] = {
      ...questions[questionIndex],
      ...body
    };

    await saveQuestions(questions);

    return NextResponse.json(questions[questionIndex]);
  } catch (_error) {
    console.error('Error updating question:', _error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

// DELETE: 質問を削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    const questionId = parseInt(id);
    if (isNaN(questionId)) {
      return NextResponse.json(
        { error: 'Invalid question ID' },
        { status: 400 }
      );
    }

    const questions = await loadQuestions();
    const questionIndex = questions.findIndex(q => q.id === questionId);

    if (questionIndex === -1) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // 質問を削除
    const deletedQuestion = questions.splice(questionIndex, 1)[0];
    await saveQuestions(questions);

    return NextResponse.json(
      { message: 'Question deleted successfully', deletedQuestion }
    );
  } catch (_error) {
    console.error('Error deleting question:', _error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
} 