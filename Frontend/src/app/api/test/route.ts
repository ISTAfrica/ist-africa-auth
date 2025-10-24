import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const responseData = {
      message: "Hello from the IST Africa Auth Test API!",
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(responseData);
  } catch (error) {

    console.error('API Error:', error); 
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}