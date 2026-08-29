/**
 * WebSocket API route for real-time collaboration
 * Handles presence updates, live markup, and cursor tracking
 */

import { NextRequest } from 'next/server';
import { WebSocketServer, WebSocket } from 'ws';
import { collaborationService } from '@/server/services/collaboration-service';

let wss: WebSocketServer | null = null;

export async function GET(req: NextRequest) {
  if (!wss) {
    return new Response('WebSocket server not initialized', { status: 503 });
  }

  return new Response('WebSocket endpoint active', { status: 200 });
}

/**
 * Initialize WebSocket server for collaboration
 * Called from instrumentation.ts or server startup
 */
export function initCollaborationWebSocket(server: any): void {
  if (wss) return;

  wss = new WebSocketServer({ server, path: '/api/collaboration/ws' });

  wss.on('connection', (ws: WebSocket, req: any) => {
    console.log('✓ Collaboration WebSocket connected');

    let currentResource: string | null = null;
    let userId: number | null = null;

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'subscribe':
            currentResource = `${message.resourceType}:${message.resourceId}`;
            userId = message.userId;
            collaborationService.subscribe(currentResource, ws);
            break;

          case 'presence':
            if (userId) {
              await collaborationService.updatePresence({
                userId,
                resourceType: message.resourceType,
                resourceId: message.resourceId,
                cursorPosition: message.cursorPosition,
                color: message.color,
                metadata: message.metadata,
              });
            }
            break;

          case 'cursor':
            if (currentResource && userId) {
              collaborationService.broadcast(
                currentResource,
                {
                  type: 'cursor',
                  resourceType: message.resourceType,
                  resourceId: message.resourceId,
                  userId,
                  data: message.position,
                  timestamp: new Date().toISOString(),
                },
                ws
              );
            }
            break;

          case 'selection':
            if (currentResource && userId) {
              collaborationService.broadcast(
                currentResource,
                {
                  type: 'selection',
                  resourceType: message.resourceType,
                  resourceId: message.resourceId,
                  userId,
                  data: message.selection,
                  timestamp: new Date().toISOString(),
                },
                ws
              );
            }
            break;

          case 'markup':
            if (userId) {
              await collaborationService.createMarkup({
                userId,
                resourceType: message.resourceType,
                resourceId: message.resourceId,
                markupType: message.markupType,
                content: message.content,
                position: message.position,
              });
            }
            break;

          default:
            console.warn('Unknown collaboration message type:', message.type);
        }
      } catch (error) {
        console.error('Collaboration WebSocket error:', error);
      }
    });

    ws.on('close', async () => {
      if (currentResource && userId) {
        const [resourceType, resourceId] = currentResource.split(':');
        await collaborationService.removePresence(userId, resourceType, resourceId);
      }
      console.log('✓ Collaboration WebSocket disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('✓ Collaboration WebSocket server initialized');
}
