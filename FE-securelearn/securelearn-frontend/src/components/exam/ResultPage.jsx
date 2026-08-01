import React from 'react';

const ResultPage = ({ score, totalQuestions }) => {
  const percentage = Math.round((score / totalQuestions) * 100);
  
  let resultMessage = "Good effort!";
  let resultColor = "text-blue-600";
  if (percentage >= 80) {
    resultMessage = "Excellent work!";
    resultColor = "text-green-600";
  } else if (percentage < 50) {
    resultMessage = "Keep practicing!";
    resultColor = "text-orange-500";
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 selection:bg-blue-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Exam Completed</h1>
          <p className="text-gray-500">Thank you for submitting your responses.</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <div className="text-5xl font-black text-gray-900 mb-2">
            {score} <span className="text-2xl text-gray-400 font-medium">/ {totalQuestions}</span>
          </div>
          <p className={`text-lg font-semibold ${resultColor}`}>
            {resultMessage} ({percentage}%)
          </p>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="w-full py-3 px-6 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ResultPage;
