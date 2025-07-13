import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // Supabaseにデータを保存
    const { error } = await supabase
      .from('survey_submissions')
      .insert([
        {
          group_id: body.groupId,
          answers: body.answers,
          created_at: body.timestamp
        }
      ]);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save survey data to database' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Survey submitted successfully to Supabase.' },
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
