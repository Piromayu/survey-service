import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body: SurveySubmission = await request.json();
    
    // バリデーション
    if (!body.submissionId || !body.groupId || !body.answers || !body.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: submissionId, groupId, answers, or timestamp' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.answers) || body.answers.length === 0) {
      return NextResponse.json(
        { error: 'Answers must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!body.groupId.trim()) {
      return NextResponse.json(
        { error: 'GroupId cannot be empty' },
        { status: 400 }
      );
    }

    // JSONファイルのパスを設定
    const dataDirectory = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDirectory, 'survey_submissions.json');

    // データディレクトリが存在しない場合は作成
    try {
      await fs.access(dataDirectory);
    } catch {
      await fs.mkdir(dataDirectory, { recursive: true });
    }

    // 既存のデータを読み込み（ファイルが存在しない場合は空配列）
    let existingData: SurveySubmission[] = [];
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      existingData = JSON.parse(fileContent);
    } catch (error) {
      // ファイルが存在しない場合は空配列のまま
      console.log('Creating new survey submissions file');
    }

    // 新しい回答データを追加
    existingData.push(body);

    // ファイルに保存
    await fs.writeFile(filePath, JSON.stringify(existingData, null, 2), 'utf-8');

    return NextResponse.json(
      { message: 'Survey submitted successfully.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error submitting survey:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON format in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error occurred while submitting survey' },
      { status: 500 }
    );
  }
} 