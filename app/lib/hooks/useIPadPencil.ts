/**
 * iPad Pencil support with haptics, pressure sensitivity, and gestures
 * Optimized for iPad touch interactions
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface PencilEvent {
  x: number;
  y: number;
  pressure: number;
  tiltX: number;
  tiltY: number;
  twist: number;
  type: 'draw' | 'erase' | 'select';
}

export interface PencilGesture {
  type: 'tap' | 'double-tap' | 'long-press' | 'swipe' | 'pinch' | 'rotate';
  data: Record<string, unknown>;
}

export interface UseIPadPencilOptions {
  onDraw?: (event: PencilEvent) => void;
  onGesture?: (gesture: PencilGesture) => void;
  enableHaptics?: boolean;
  enablePressure?: boolean;
  enableTilt?: boolean;
}

export function useIPadPencil(options: UseIPadPencilOptions) {
  const {
    onDraw,
    onGesture,
    enableHaptics = true,
    enablePressure = true,
    enableTilt = true,
  } = options;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPencilActive, setIsPencilActive] = useState(false);
  const lastTouchRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const gestureStateRef = useRef<{
    initialDistance?: number;
    initialAngle?: number;
    touchCount: number;
  }>({ touchCount: 0 });

  const triggerHaptic = useCallback(
    (style: 'light' | 'medium' | 'heavy' = 'light') => {
      if (!enableHaptics) return;

      if ('vibrate' in navigator) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30],
        };
        navigator.vibrate(patterns[style]);
      }

      if ((window as any).webkit?.messageHandlers?.haptics) {
        (window as any).webkit.messageHandlers.haptics.postMessage({ style });
      }
    },
    [enableHaptics]
  );

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (e.pointerType === 'pen') {
        setIsPencilActive(true);
        setIsDrawing(true);
        triggerHaptic('light');

        const event: PencilEvent = {
          x: e.clientX,
          y: e.clientY,
          pressure: enablePressure ? e.pressure : 1,
          tiltX: enableTilt ? e.tiltX : 0,
          tiltY: enableTilt ? e.tiltY : 0,
          twist: (e as any).twist || 0,
          type: e.buttons === 32 ? 'erase' : 'draw',
        };

        if (onDraw) {
          onDraw(event);
        }
      }

      const now = Date.now();
      const touch = { x: e.clientX, y: e.clientY, time: now };

      if (lastTouchRef.current) {
        const timeDiff = now - lastTouchRef.current.time;
        const distance = Math.hypot(
          touch.x - lastTouchRef.current.x,
          touch.y - lastTouchRef.current.y
        );

        if (timeDiff < 300 && distance < 30) {
          if (onGesture) {
            onGesture({ type: 'double-tap', data: { x: touch.x, y: touch.y } });
          }
          triggerHaptic('medium');
          lastTouchRef.current = null;
          return;
        }
      }

      lastTouchRef.current = touch;
    },
    [onDraw, onGesture, triggerHaptic, enablePressure, enableTilt]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDrawing || e.pointerType !== 'pen') return;

      const event: PencilEvent = {
        x: e.clientX,
        y: e.clientY,
        pressure: enablePressure ? e.pressure : 1,
        tiltX: enableTilt ? e.tiltX : 0,
        tiltY: enableTilt ? e.tiltY : 0,
        twist: (e as any).twist || 0,
        type: e.buttons === 32 ? 'erase' : 'draw',
      };

      if (onDraw) {
        onDraw(event);
      }

      if (e.pressure > 0.8) {
        triggerHaptic('medium');
      }
    },
    [isDrawing, onDraw, triggerHaptic, enablePressure, enableTilt]
  );

  const handlePointerUp = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      triggerHaptic('light');
    }
  }, [isDrawing, triggerHaptic]);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const touches = e.touches;
      gestureStateRef.current.touchCount = touches.length;

      if (touches.length === 2) {
        const touch1 = touches[0];
        const touch2 = touches[1];

        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        const angle = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        );

        gestureStateRef.current.initialDistance = distance;
        gestureStateRef.current.initialAngle = angle;
      }
    },
    [onGesture]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      const touches = e.touches;

      if (touches.length === 2 && gestureStateRef.current.initialDistance) {
        const touch1 = touches[0];
        const touch2 = touches[1];

        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );

        const currentAngle = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        );

        const scale = currentDistance / gestureStateRef.current.initialDistance;
        const rotation =
          ((currentAngle - gestureStateRef.current.initialAngle!) * 180) / Math.PI;

        if (Math.abs(scale - 1) > 0.1) {
          if (onGesture) {
            onGesture({
              type: 'pinch',
              data: { scale, centerX: (touch1.clientX + touch2.clientX) / 2, centerY: (touch1.clientY + touch2.clientY) / 2 },
            });
          }
          triggerHaptic('light');
        }

        if (Math.abs(rotation) > 5) {
          if (onGesture) {
            onGesture({ type: 'rotate', data: { rotation } });
          }
          triggerHaptic('light');
        }
      }
    },
    [onGesture, triggerHaptic]
  );

  const handleTouchEnd = useCallback(() => {
    gestureStateRef.current = { touchCount: 0 };
  }, []);

  const handleLongPress = useCallback(() => {
    if (lastTouchRef.current && Date.now() - lastTouchRef.current.time >= 500) {
      if (onGesture) {
        onGesture({
          type: 'long-press',
          data: { x: lastTouchRef.current.x, y: lastTouchRef.current.y },
        });
      }
      triggerHaptic('heavy');
      lastTouchRef.current = null;
    }
  }, [onGesture, triggerHaptic]);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;

    element.addEventListener('pointerdown', handlePointerDown as any);
    element.addEventListener('pointermove', handlePointerMove as any);
    element.addEventListener('pointerup', handlePointerUp as any);
    element.addEventListener('touchstart', handleTouchStart as any);
    element.addEventListener('touchmove', handleTouchMove as any);
    element.addEventListener('touchend', handleTouchEnd as any);

    const longPressTimer = setInterval(handleLongPress, 500);

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown as any);
      element.removeEventListener('pointermove', handlePointerMove as any);
      element.removeEventListener('pointerup', handlePointerUp as any);
      element.removeEventListener('touchstart', handleTouchStart as any);
      element.removeEventListener('touchmove', handleTouchMove as any);
      element.removeEventListener('touchend', handleTouchEnd as any);
      clearInterval(longPressTimer);
    };
  }, [
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleLongPress,
  ]);

  return {
    canvasRef,
    isDrawing,
    isPencilActive,
    triggerHaptic,
  };
}

/**
 * Helper to detect if running on iPad
 */
export function isIPad(): boolean {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent;
  return (
    /iPad/.test(userAgent) ||
    (/Macintosh/.test(userAgent) && 'ontouchend' in document)
  );
}

/**
 * Helper to detect if Apple Pencil is supported
 */
export function isPencilSupported(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'PointerEvent' in window &&
    isIPad()
  );
}
