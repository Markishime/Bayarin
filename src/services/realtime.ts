import { useEffect, useRef, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type ChangePayload<T> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: Partial<T>;
  table: string;
  schema: string;
};

export function useRealtimeTable<T extends Record<string, unknown>>(
  table: string,
  filterValue: string,
  onInsert?: (row: T) => void,
  onUpdate?: (row: T) => void,
  onDelete?: (old: Partial<T>) => void,
  filterColumn = 'user_id',
) {
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete });
  callbacksRef.current = { onInsert, onUpdate, onDelete };

  useEffect(() => {
    if (!supabase || !filterValue) return;

    const client = supabase;

    const channel: RealtimeChannel = client
      .channel(`realtime-${table}-${filterColumn}-${filterValue}`)
      .on(
        'postgres_changes' as never,
        {
          event: '*',
          schema: 'public',
          table,
          filter: `${filterColumn}=eq.${filterValue}`,
        } as never,
        (payload: ChangePayload<T>) => {
          const { onInsert, onUpdate, onDelete } = callbacksRef.current;
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload.new);
              break;
            case 'UPDATE':
              onUpdate?.(payload.new);
              break;
            case 'DELETE':
              onDelete?.(payload.old);
              break;
          }
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [table, filterValue, filterColumn]);
}

export function useRealtimeBills(
  householdId: string,
  handlers: {
    onInsert?: (bill: Record<string, unknown>) => void;
    onUpdate?: (bill: Record<string, unknown>) => void;
    onDelete?: (old: Partial<Record<string, unknown>>) => void;
  },
) {
  useRealtimeTable('bills', householdId, handlers.onInsert, handlers.onUpdate, handlers.onDelete, 'household_id');
}

export function useRealtimeActivity(
  householdId: string,
  handlers: {
    onInsert?: (event: Record<string, unknown>) => void;
    onUpdate?: (event: Record<string, unknown>) => void;
  },
) {
  useRealtimeTable('activity_events', householdId, handlers.onInsert, handlers.onUpdate, undefined, 'household_id');
}

export function useRealtimeNotifications(
  userId: string,
  handlers: {
    onInsert?: (notification: Record<string, unknown>) => void;
    onUpdate?: (notification: Record<string, unknown>) => void;
  },
) {
  useRealtimeTable('notifications', userId, handlers.onInsert, handlers.onUpdate);
}

export function useRealtimeHouseholdMembers(
  householdId: string,
  handlers: {
    onInsert?: (member: Record<string, unknown>) => void;
    onDelete?: (old: Partial<Record<string, unknown>>) => void;
  },
) {
  useRealtimeTable('household_memberships', householdId, handlers.onInsert, undefined, handlers.onDelete, 'household_id');
}
