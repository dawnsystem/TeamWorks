import { Routes, Route } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import MobileBottomNav from '@/components/MobileBottomNav';
import ProjectView from '@/components/ProjectView';
import TodayView from '@/components/TodayView';
import WeekView from '@/components/WeekView';
import LabelView from '@/components/LabelView';
import TaskEditor from '@/components/TaskEditor';
import TaskDetailView from '@/components/TaskDetailView';
import AIAssistant from '@/components/AIAssistant';
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp';
import TaskRelationshipPopup from '@/components/TaskRelationshipPopup';
import CommandPalette from '@/components/CommandPalette';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTaskRelationshipStore, useCommandPaletteStore } from '@/store/useStore';
import { tasksAPI } from '@/lib/api';

export default function Dashboard() {
  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Task relationship popup state
  const relationshipState = useTaskRelationshipStore();
  
  // Command palette state
  const paletteState = useCommandPaletteStore();
  
  // Fetch parent task when popup opens
  const { data: parentTaskData } = useQuery({
    queryKey: ['tasks', relationshipState.parentTaskId],
    queryFn: () => tasksAPI.getOne(relationshipState.parentTaskId!).then((res) => res.data),
    enabled: relationshipState.isOpen && !!relationshipState.parentTaskId,
  });

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        {/* Main content area with bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0" style={{ overscrollBehavior: 'contain' }}>
          <Routes>
            <Route path="/" element={<ProjectView />} />
            <Route path="/today" element={<TodayView />} />
            <Route path="/week" element={<WeekView />} />
            <Route path="/project/:id" element={<ProjectView />} />
            <Route path="/label/:id" element={<LabelView />} />
          </Routes>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>

      {/* Task Editor Modal */}
      <TaskEditor />

      {/* Task Detail View */}
      <TaskDetailView />

      {/* AI Assistant */}
      <AIAssistant />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp />

      {/* Command Palette */}
      <CommandPalette 
        isOpen={paletteState.isOpen} 
        onClose={paletteState.closePalette} 
      />

      {/* Task Relationship Popup - shown when last subtask is completed */}
      {relationshipState.isOpen && parentTaskData && relationshipState.completedSubTaskTitle && (
        <TaskRelationshipPopup
          parentTask={parentTaskData}
          completedSubTaskTitle={relationshipState.completedSubTaskTitle}
          onClose={relationshipState.closePopup}
        />
      )}
    </div>
  );
}

