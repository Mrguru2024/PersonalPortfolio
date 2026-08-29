/**
 * React hook for real-time collaboration
 * Manages WebSocket connection, presence updates, and live markup
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface CollaborationUser {
  userId: number;
  username: string;
  color: string;
  cursorPosition?: { x: number; y: number };
}

export interface CollaborationMarkup {
  id: number;
  userId: number;
  username: string;
  content: string;
  position?: Record<string, unknown>;
  resolved: boolean;
  createdAt: string;
}

export interface UseCollaborationOptions {
  resourceType: string;
  resourceId: string;
  userId: number;
  username: string;
  color?: string;
  onPresenceUpdate?: (users: CollaborationUser[]) => void;
  onMarkupCreated?: (markup: CollaborationMarkup) => void;
  onCursorMove?: (userId: number, position: { x: number; y: number }) => void;
}

export function useCollaboration(options: UseCollaborationOptions) {
  const {
    resourceType,
    resourceId,
    userId,
    username,
    color = `hsl(${Math.random() * 360}, 70%, 50%)`,
    onPresenceUpdate,
    onMarkupCreated,
    onCursorMove,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const [markups, setMarkups] = useState<CollaborationMarkup[]>([]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/collaboration/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(
        JSON.stringify({
          type: 'subscribe',
          resourceType,
          resourceId,
          userId,
        })
      );

      ws.send(
        JSON.stringify({
          type: 'presence',
          resourceType,
          resourceId,
          userId,
          username,
          color,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'presence':
            if (message.data.removed) {
              setUsers((prev) => prev.filter((u) => u.userId !== message.userId));
            } else {
              setUsers((prev) => {
                const existing = prev.find((u) => u.userId === message.userId);
                if (existing) {
                  return prev.map((u) =>
                    u.userId === message.userId ? { ...u, ...message.data } : u
                  );
                }
                return [
                  ...prev,
                  {
                    userId: message.userId,
                    username: message.username || 'Anonymous',
                    color: message.data.color,
                    cursorPosition: message.data.cursorPosition,
                  },
                ];
              });
            }
            break;

          case 'cursor':
            if (onCursorMove && message.userId !== userId) {
              onCursorMove(message.userId, message.data);
            }
            setUsers((prev) =>
              prev.map((u) =>
                u.userId === message.userId ? { ...u, cursorPosition: message.data } : u
              )
            );
            break;

          case 'markup':
            if (message.data.resolved) {
              setMarkups((prev) =>
                prev.map((m) =>
                  m.id === message.data.id ? { ...m, resolved: true } : m
                )
              );
            } else {
              const newMarkup: CollaborationMarkup = {
                id: message.data.id,
                userId: message.userId,
                username: message.username || 'Anonymous',
                content: message.data.content,
                position: message.data.position,
                resolved: false,
                createdAt: message.timestamp,
              };
              setMarkups((prev) => [newMarkup, ...prev]);
              if (onMarkupCreated) {
                onMarkupCreated(newMarkup);
              }
            }
            break;
        }
      } catch (error) {
        console.error('Error processing collaboration message:', error);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setTimeout(() => {
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
      }, 1000);
    };

    ws.onerror = (error) => {
      console.error('Collaboration WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [resourceType, resourceId, userId, username, color, onMarkupCreated, onCursorMove]);

  const updateCursor = useCallback(
    (x: number, y: number) => {
      if (wsRef.current && connected) {
        wsRef.current.send(
          JSON.stringify({
            type: 'cursor',
            resourceType,
            resourceId,
            position: { x, y },
          })
        );
      }
    },
    [connected, resourceType, resourceId]
  );

  const updateSelection = useCallback(
    (selection: Record<string, unknown>) => {
      if (wsRef.current && connected) {
        wsRef.current.send(
          JSON.stringify({
            type: 'selection',
            resourceType,
            resourceId,
            selection,
          })
        );
      }
    },
    [connected, resourceType, resourceId]
  );

  const createMarkup = useCallback(
    (content: string, markupType = 'comment', position?: Record<string, unknown>) => {
      if (wsRef.current && connected) {
        wsRef.current.send(
          JSON.stringify({
            type: 'markup',
            resourceType,
            resourceId,
            markupType,
            content,
            position,
          })
        );
      }
    },
    [connected, resourceType, resourceId]
  );

  return {
    connected,
    users: users.filter((u) => u.userId !== userId),
    markups,
    updateCursor,
    updateSelection,
    createMarkup,
  };
}
