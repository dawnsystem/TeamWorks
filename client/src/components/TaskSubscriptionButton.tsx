import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { taskSubscriptionAPI } from '@/lib/taskSubscriptionApi';
import toast from 'react-hot-toast';

interface TaskSubscriptionButtonProps {
  taskId: string;
}

export default function TaskSubscriptionButton({ taskId }: TaskSubscriptionButtonProps) {
  const queryClient = useQueryClient();

  // Check if user is subscribed
  const { data: subscriptionData, isLoading: isCheckingSubscription } = useQuery({
    queryKey: ['taskSubscription', taskId],
    queryFn: () => taskSubscriptionAPI.checkSubscription(taskId).then(res => res.data),
    enabled: !!taskId,
  });

  const isSubscribed = subscriptionData?.subscribed || false;

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: () => taskSubscriptionAPI.subscribe(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskSubscription', taskId] });
      toast.success('Te has suscrito a las actualizaciones de esta tarea');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al suscribirse');
    },
  });

  // Unsubscribe mutation
  const unsubscribeMutation = useMutation({
    mutationFn: () => taskSubscriptionAPI.unsubscribe(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskSubscription', taskId] });
      toast.success('Te has desuscrito de las actualizaciones de esta tarea');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al desuscribirse');
    },
  });

  const handleToggleSubscription = () => {
    if (isSubscribed) {
      unsubscribeMutation.mutate();
    } else {
      subscribeMutation.mutate();
    }
  };

  const isLoading = subscribeMutation.isPending || unsubscribeMutation.isPending;

  return (
    <button
      onClick={handleToggleSubscription}
      disabled={isCheckingSubscription || isLoading}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${isSubscribed
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        }
        ${(isCheckingSubscription || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      title={isSubscribed ? 'Desuscribirse de actualizaciones' : 'Suscribirse a actualizaciones'}
    >
      {isCheckingSubscription || isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isSubscribed ? (
        <Bell className="h-4 w-4" />
      ) : (
        <BellOff className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">
        {isSubscribed ? 'Suscrito' : 'Suscribirse'}
      </span>
    </button>
  );
}
