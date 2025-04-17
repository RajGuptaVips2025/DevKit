import React from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Step } from '@/app/types';

interface StepsListProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export function StepsList({ steps, currentStep, onStepClick }: StepsListProps) {
  return (

    <div className="bg-black rounded-lg shadow-lg p-4 h-[70vh] overflow-auto">
    <h2 className="text-lg font-semibold mb-4 text-gray-100">Build Steps</h2>
    <div className="space-y-4">
      {steps.map((step,index) => (
        <div
          key={index}
          className={`p-1 rounded-lg cursor-pointer transition-colors ${
            currentStep === step.id
              ? 'bg-gray-800 border border-gray-700'
              : 'hover:bg-zinc-800'
          }`}
          onClick={() => onStepClick(step.id)}
        >
          <div className="flex items-center gap-2">
            {step.status === 'completed' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : step.status === 'in-progress' ? (
              <Clock className="w-5 h-5 text-blue-400" />
            ) : (
              <Circle className="w-5 h-5 text-gray-600" />
            )}
            <h3 className="font-medium text-gray-100">{step.title}</h3>
          </div>
          <p className="text-sm text-gray-400 mt-2">{step.description}</p>
        </div>
      ))}
    </div>
  </div>

    // <div className="rounded-lg border border-gray-200 p-2 h-[53vh] overflow-auto">
    //   <h2 className="text-lg font-semibold mb-4">Build Steps</h2>
    //   <div className="space-y-2">
    //     {steps.map((step, index) => (
    //       <div
    //         key={index}
    //         className={`p-1 rounded-lg cursor-pointer transition-colors ${currentStep === step.id
    //             ? ' border border-gray-500'
    //             : 'hover:bg-gray-200'
    //           }`}
    //         onClick={() => onStepClick(step.id)}
    //       >
    //         <div className="flex items-center gap-2">
    //           {step.status === 'completed' ? (
    //             <CheckCircle className="w-5 h-5 text-green-500" />
    //           ) : step.status === 'in-progress' ? (
    //             <Clock className="w-5 h-5 text-blue-400" />
    //           ) : (
    //             <Circle className="w-5 h-5 text-gray-600" />
    //           )}
    //           <h3 className="font-medium text-sm ">{step.title}</h3>
    //         </div>
    //         <p className="text-sm text-gray-400 mt-2">{step.description}</p>
    //       </div>
    //     ))}
    //   </div>
    // </div>
  );
}