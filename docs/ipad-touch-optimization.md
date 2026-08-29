# iPad Touch and Apple Pencil Optimization

This document describes the iPad touch and Apple Pencil optimizations implemented in the Ascendra Technologies application.

## Features

### Apple Pencil Support

- **Pressure Sensitivity**: Detects pressure levels from 0.0 to 1.0 for dynamic stroke width
- **Tilt Detection**: Captures tiltX and tiltY for shading and artistic effects
- **Twist Support**: Reads barrel rotation angle (twist) on supported models
- **Eraser Detection**: Automatically switches to erase mode when using the eraser end

### Haptic Feedback

Three levels of haptic feedback are provided:
- **Light**: Quick tap for basic interactions (10ms)
- **Medium**: Moderate vibration for confirmations (20ms)
- **Heavy**: Strong feedback for important actions (30ms)

Haptics are triggered on:
- Pencil touch down
- Pressure exceeding 80%
- Gesture recognition (double-tap, long-press, etc.)

### Multi-Touch Gestures

- **Double-Tap**: Quick succession of taps (< 300ms, < 30px apart)
- **Long-Press**: Hold for 500ms to trigger context menu
- **Pinch**: Two-finger pinch to zoom (scale detection with 10% threshold)
- **Rotate**: Two-finger rotation (5° threshold)
- **Swipe**: Fast directional movement for navigation

## Usage

### Basic Drawing Canvas

```typescript
import { useIPadPencil } from '@/app/lib/hooks/useIPadPencil';

function DrawingCanvas() {
  const { canvasRef, isDrawing, isPencilActive, triggerHaptic } = useIPadPencil({
    onDraw: (event) => {
      // Handle drawing with pressure, tilt, and twist
      const { x, y, pressure, tiltX, tiltY, twist, type } = event;
      
      if (type === 'erase') {
        // Erase mode
      } else {
        // Draw with pressure-sensitive stroke
        const strokeWidth = 2 + pressure * 8;
        ctx.lineWidth = strokeWidth;
      }
    },
    onGesture: (gesture) => {
      // Handle gestures
      if (gesture.type === 'pinch') {
        const { scale } = gesture.data;
        // Zoom canvas
      } else if (gesture.type === 'rotate') {
        const { rotation } = gesture.data;
        // Rotate canvas
      }
    },
    enableHaptics: true,
    enablePressure: true,
    enableTilt: true,
  });

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ touchAction: 'none' }}
    />
  );
}
```

### Detection Utilities

```typescript
import { isIPad, isPencilSupported } from '@/app/lib/hooks/useIPadPencil';

if (isIPad()) {
  console.log('Running on iPad');
}

if (isPencilSupported()) {
  console.log('Apple Pencil is supported');
}
```

## Technical Details

### Pointer Events API

Uses the modern Pointer Events API for unified touch/pen input:
- `pointerType === 'pen'` for Apple Pencil detection
- `pressure` property for pressure sensitivity
- `tiltX`, `tiltY` for tilt angle
- `buttons === 32` for eraser detection

### Touch Events API

Fallback to Touch Events for multi-touch gestures:
- Pinch detection via distance calculation
- Rotation via angle calculation
- Gesture state management for complex interactions

### Haptic Feedback Methods

1. **Navigator Vibration API**: Standard web vibration (all browsers)
2. **WebKit Message Handlers**: Native iOS haptics (if available)

### Performance Optimization

- Debounced gesture detection (threshold-based)
- RAF-based drawing for smooth 120Hz ProMotion display
- Event listener cleanup to prevent memory leaks
- Gesture state refs for zero-render updates

## Browser Compatibility

- Safari on iPadOS 13.4+ (full support)
- Chrome on iPadOS (partial - no haptics)
- Firefox on iPadOS (partial - no haptics)

## Best Practices

1. Always set `touch-action: none` on drawing surfaces
2. Use `preventDefault()` on touch events to avoid scrolling
3. Implement pressure curves for natural stroke feeling
4. Provide visual feedback for haptic-disabled browsers
5. Test on both iPad Pro (ProMotion 120Hz) and standard iPad models

## Future Enhancements

- Scribble handwriting recognition integration
- Palm rejection improvements
- Custom gesture recognition (e.g., circle to select)
- Pressure curve customization UI
- Multi-user collaborative drawing
