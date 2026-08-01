import React, { useState, useEffect } from 'react';
import QuestionCard from './QuestionCard';
import ResultPage from './ResultPage';

// Mock questions for demonstration
const mockQuestions = [
  { id: 1, text: "Wait, isn't this test easy?", options: ["Yes", "No", "Maybe", "I don't know"], correctOption: "Yes" },
  { id: 2, text: "Which language runs in a web browser?", options: ["Java", "C", "Python", "JavaScript"], correctOption: "JavaScript" },
  { id: 3, text: "What does CSS stand for?", options: ["Central Style Sheets", "Cascading Style Sheets", "Cascading Simple Sheets", "Cars SUVs Sailboats"], correctOption: "Cascading Style Sheets" },
  { id: 4, text: "What year was JavaScript launched?", options: ["1996", "1995", "1994", "None of the above"], correctOption: "1995" }
];

const ExamPage = () => {
  const [examState, setExamState] = useState('intro'); // 'intro', 'running', 'submitted'
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);

  // Timer logic
  useEffect(() => {
    let timer;
    if (examState === 'running' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && examState === 'running') {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [examState, timeLeft]);

  // Prevent refresh warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (examState === 'running') {
        const message = "Are you sure you want to leave? Your exam progress will be lost.";
        e.returnValue = message;
        return message;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [examState]);

  const handleStart = () => {
    setExamState('running');
  };

  const handleSelectOption = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = () => {
    let calculatedScore = 0;
    mockQuestions.forEach(q => {
      if (answers[q.id] === q.correctOption) {
        calculatedScore += 1;
      }
    });
    setScore(calculatedScore);
    setExamState('submitted');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (examState === 'intro') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 selection:bg-blue-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-2">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Final Assessment</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            You will have 10 minutes to complete the {mockQuestions.length}-question exam. 
            Ensure your connection is stable. <span className="font-semibold text-gray-900">Do not refresh</span> the page once started.
          </p>
          <button 
            onClick={handleStart}
            className="w-full mt-4 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  if (examState === 'submitted') {
    return <ResultPage score={score} totalQuestions={mockQuestions.length} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col selection:bg-blue-100 pb-20">
      {/* Header / Timer */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm px-4 sm:px-8 py-4 flex justify-between items-center transition-all">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-sm">
            <span className="font-bold text-sm">F</span>
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800 hidden sm:block">Final Assessment</h1>
        </div>
        
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-mono text-lg font-bold shadow-inner border transition-colors ${
          timeLeft < 60 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-gray-50 text-gray-700 border-gray-200'
        }`}>
          <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="tracking-wide">{formatTime(timeLeft)}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl space-y-6 sm:space-y-8">
        {mockQuestions.map((q, index) => (
          <QuestionCard 
            key={q.id}
            questionNumber={index + 1}
            question={q}
            selectedOption={answers[q.id]}
            onSelectOption={(option) => handleSelectOption(q.id, option)}
          />
        ))}

        {/* Submit Section */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="mb-4 sm:mb-0 text-center sm:text-left">
            <p className="text-gray-900 font-medium">Ready to submit?</p>
            <p className="text-sm text-gray-500">Ensure all questions are answered before submitting.</p>
          </div>
          <button 
            onClick={handleSubmit}
            className="w-full sm:w-auto py-3 px-8 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 hover:-translate-y-0.5"
          >
            Submit Exam
          </button>
        </div>
      </main>
    </div>
  );
};

export default ExamPage;
