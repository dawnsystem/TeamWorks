import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Send,
  Sparkles,
  Loader2,
  MessageSquare,
  Brain,
  HelpCircle,
  ClipboardList,
  Pin,
  PinOff,
  Maximize2,
  Minimize2,
  Settings as SettingsIcon,
  Trash2,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAIStore } from '@/store/useStore';
import { aiAPI } from '@/lib/api';
import { Button, Input, ScrollArea } from '@/components/ui';

type AIMode = 'ASK' | 'PLAN' | 'AGENT';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function AIAgentEnhanced() {
  const queryClient = useQueryClient();
  const {
    isOpen,
    mode,
    setMode,
    viewType,
    setViewType,
    isPinned,
    togglePin,
    currentConversationId,
    conversations,
    customInstructions,
    setCustomInstructions,
    createConversation,
    setCurrentConversation,
    addMessage,
    deleteConversation,
    toggleAI,
    autoExecute,
    setAutoExecute,
  } = useAIStore();

  // const aiProvider = useSettingsStore((state) => state.aiProvider);
  // const isMobile = useIsMobile();

  const [message, setMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 450, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find((c) => c.id === currentConversationId);
  const messages: Message[] = currentConversation?.messages || [];

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Create initial conversation if none exists
    if (isOpen && !currentConversationId) {
      createConversation(mode);
    }
  }, [isOpen, currentConversationId, mode, createConversation]);

  const unifiedMutation = useMutation({
    mutationFn: (payload: {
      message: string;
      mode: AIMode;
      conversationHistory: Message[];
      conversationId?: string;
      autoExecute?: boolean;
    }) => aiAPI.unified(payload),
    onSuccess: (response) => {
      const data = response.data;

      // Add AI response to conversation
      if (currentConversationId) {
        addMessage(currentConversationId, {
          role: 'assistant',
          content: data.message || data.answer || 'Respuesta recibida',
          timestamp: Date.now(),
        });
      }

      // Handle mode suggestions
      if (data.canChangeMode && data.suggestedMode) {
        toast(
          `💡 Sugerencia: ${data.suggestedModeReason || `Cambiar a modo ${data.suggestedMode}`}`,
          {
            duration: 6000,
          }
        );
      }

      // Handle actions if in AGENT mode
      if (data.suggestedActions && data.suggestedActions.length > 0) {
        toast.success(`${data.suggestedActions.length} acciones preparadas`);
        if (data.executedActions) {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
      }

      // Handle plan if in PLAN mode
      if (data.plan) {
        toast.success('Plan generado correctamente');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al procesar mensaje');
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || unifiedMutation.isPending) return;

    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };

    // Add user message to conversation
    if (currentConversationId) {
      addMessage(currentConversationId, userMessage);
    }

    // Prepare conversation history (include custom instructions if set)
    const conversationHistory = messages.concat([userMessage]);
    if (customInstructions) {
      conversationHistory.unshift({
        role: 'assistant',
        content: `Instrucciones personalizadas del usuario: ${customInstructions}`,
        timestamp: 0,
      });
    }

    // Send to API
    unifiedMutation.mutate({
      message: message.trim(),
      mode,
      conversationHistory,
      conversationId: currentConversationId || undefined,
      autoExecute: mode === 'AGENT' ? autoExecute : false,
    });

    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = () => {
    createConversation(mode);
    toast.success('Nueva conversación creada');
  };

  const handleDeleteConversation = (id: string) => {
    if (confirm('¿Eliminar esta conversación?')) {
      deleteConversation(id);
      toast.success('Conversación eliminada');
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPinned || viewType === 'sidebar') return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  const containerClass =
    viewType === 'sidebar'
      ? 'fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col'
      : isPinned
      ? 'fixed bottom-4 right-4 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 flex flex-col'
      : `fixed w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 flex flex-col ${
          isDragging ? 'cursor-move' : ''
        }`;

  const containerStyle = viewType === 'modal' && !isPinned ? { left: position.x, top: position.y } : {};

  return (
    <div className={containerClass} style={containerStyle}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gradient-to-r from-red-500 to-pink-500 text-white"
        onMouseDown={handleMouseDown}
        style={{ cursor: !isPinned && viewType === 'modal' ? 'move' : 'default' }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">AI Assistant</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
            {mode}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {viewType === 'modal' && (
            <button
              onClick={togglePin}
              className="p-1.5 hover:bg-white/20 rounded transition-colors"
              title={isPinned ? 'Desanclar' : 'Anclar'}
            >
              {isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => setViewType(viewType === 'modal' ? 'sidebar' : 'modal')}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            title={viewType === 'modal' ? 'Modo sidebar' : 'Modo modal'}
          >
            {viewType === 'modal' ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Configuración"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
          <button
            onClick={toggleAI}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-1 p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        {(['ASK', 'PLAN', 'AGENT'] as AIMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
              mode === m
                ? 'bg-red-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {m === 'ASK' && <HelpCircle className="w-4 h-4 inline mr-1" />}
            {m === 'PLAN' && <ClipboardList className="w-4 h-4 inline mr-1" />}
            {m === 'AGENT' && <Brain className="w-4 h-4 inline mr-1" />}
            {m}
          </button>
        ))}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">
              Instrucciones personalizadas
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="w-full px-3 py-2 border dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-gray-200"
              placeholder="Ej: Siempre usa prioridad alta para tareas urgentes..."
              rows={3}
            />
          </div>
          {mode === 'AGENT' && (
            <label className="flex items-center gap-2 text-sm dark:text-gray-300">
              <input
                type="checkbox"
                checked={autoExecute}
                onChange={(e) => setAutoExecute(e.target.checked)}
                className="rounded"
              />
              Ejecutar acciones automáticamente
            </label>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowConversations(!showConversations)}
              className="flex-1"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Conversaciones ({conversations.length})
            </Button>
            <Button size="sm" onClick={handleNewConversation} className="flex-1">
              <Plus className="w-4 h-4 mr-1" />
              Nueva
            </Button>
          </div>
        </div>
      )}

      {/* Conversations List */}
      {showConversations && (
        <div className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 max-h-48 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No hay conversaciones previas
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-3 border-b last:border-0 dark:border-gray-700 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${
                  conv.id === currentConversationId ? 'bg-gray-100 dark:bg-gray-800' : ''
                }`}
                onClick={() => setCurrentConversation(conv.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate dark:text-gray-200">
                    {conv.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {conv.messages.length} mensajes · {conv.mode}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conv.id);
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <Trash2 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center mb-4">
              {mode === 'ASK' && <HelpCircle className="w-8 h-8 text-white" />}
              {mode === 'PLAN' && <ClipboardList className="w-8 h-8 text-white" />}
              {mode === 'AGENT' && <Brain className="w-8 h-8 text-white" />}
            </div>
            <h3 className="font-semibold text-lg mb-2 dark:text-gray-200">
              Modo {mode}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs">
              {mode === 'ASK' && 'Pregúntame cualquier cosa sobre gestión de tareas'}
              {mode === 'PLAN' && 'Describe tu objetivo y crearé un plan detallado'}
              {mode === 'AGENT' && 'Dime qué necesitas y lo haré automáticamente'}
            </p>
          </div>
        ) : (
          messages
            .filter((msg) => msg.timestamp > 0) // Filter out custom instructions
            .map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-red-100' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
        )}
        {unifiedMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Mensaje en modo ${mode}...`}
            disabled={unifiedMutation.isPending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || unifiedMutation.isPending}
            size="sm"
          >
            {unifiedMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
