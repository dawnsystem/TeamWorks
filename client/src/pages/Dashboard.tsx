import { Routes, Route } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ProjectView from '@/components/ProjectView';
import TodayView from '@/components/TodayView';
import WeekView from '@/components/WeekView';
import LabelView from '@/components/LabelView';
import TaskEditor from '@/components/TaskEditor';
import TaskDetailView from '@/components/TaskDetailView';
import AIAssistant from '@/components/AIAssistant';

export default function Dashboard() {

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<ProjectView />} />
            <Route path="/today" element={<TodayView />} />
            <Route path="/week" element={<WeekView />} />
            <Route path="/project/:id" element={<ProjectView />} />
            <Route path="/label/:id" element={<LabelView />} />
          </Routes>
        </main>
      </div>

      {/* Task Editor Modal */}
      <TaskEditor />

      {/* Task Detail View */}
      <TaskDetailView />

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
}

