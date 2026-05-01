import React from 'react';
import { AIAssistant } from '../components/AIAssistant';

const AIAssistantPage: React.FC = () => {
  return (
    <div className="h-[calc(100vh-140px)] rounded-[40px] overflow-hidden shadow-2xl border border-slate-100">
      <AIAssistant isFullPage />
    </div>
  );
};

export default AIAssistantPage;
