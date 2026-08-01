import React from 'react';

const QuestionCard = ({ questionNumber, question, selectedOption, onSelectOption }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 transition-shadow duration-300 hover:shadow-md">
      <div className="mb-6">
        <span className="inline-block px-3 py-1 mb-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-full">
          Question {questionNumber}
        </span>
        <h2 className="text-lg sm:text-xl font-medium text-gray-900 leading-relaxed">
          {question.text}
        </h2>
      </div>
      
      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedOption === option;
          return (
            <label 
              key={index} 
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-shrink-0 items-center justify-center w-5 h-5 border-2 rounded-full mr-4 bg-white border-gray-300">
                {isSelected && (
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
                )}
              </div>
              <input 
                type="radio" 
                name={`question-${question.id}`} 
                value={option} 
                checked={isSelected}
                onChange={() => onSelectOption(option)}
                className="hidden" /* visual radio button is built with divs */
              />
              <span className={`text-base flex-grow ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                {option}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;
