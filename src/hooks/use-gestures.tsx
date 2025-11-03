import { useRef, useEffect, useState } from 'react';

interface Position {
  x: number;
  y: number;
}

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export const useSwipe = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
}: SwipeOptions) => {
  const touchStart = useRef<Position | null>(null);
  const touchEnd = useRef<Position | null>(null);

  const minSwipeDistance = threshold;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;

    const distanceX = touchStart.current.x - touchEnd.current.x;
    const distanceY = touchStart.current.y - touchEnd.current.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      if (distanceX > minSwipeDistance) {
        onSwipeLeft?.();
      } else if (distanceX < -minSwipeDistance) {
        onSwipeRight?.();
      }
    } else {
      if (distanceY > minSwipeDistance) {
        onSwipeUp?.();
      } else if (distanceY < -minSwipeDistance) {
        onSwipeDown?.();
      }
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};

interface LongPressOptions {
  onLongPress: () => void;
  delay?: number;
}

export const useLongPress = ({ onLongPress, delay = 500 }: LongPressOptions) => {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef<NodeJS.Timeout>();
  const target = useRef<EventTarget>();

  const start = (event: React.TouchEvent | React.MouseEvent) => {
    if (event.type === 'click') event.preventDefault();
    target.current = event.target;
    timeout.current = setTimeout(() => {
      onLongPress();
      setLongPressTriggered(true);
    }, delay);
  };

  const clear = (event: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    if (shouldTriggerClick && !longPressTriggered && event.target === target.current) {
      // This is a regular click
    }
    setLongPressTriggered(false);
  };

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchEnd: (e: React.TouchEvent) => clear(e),
  };
};

interface PinchOptions {
  onPinch?: (scale: number) => void;
  onPinchStart?: () => void;
  onPinchEnd?: () => void;
}

export const usePinch = ({ onPinch, onPinchStart, onPinchEnd }: PinchOptions) => {
  const [isPinching, setIsPinching] = useState(false);
  const initialDistance = useRef<number>(0);

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      initialDistance.current = getDistance(e.touches[0], e.touches[1]);
      onPinchStart?.();
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistance.current;
      onPinch?.(scale);
    }
  };

  const onTouchEnd = () => {
    if (isPinching) {
      setIsPinching(false);
      initialDistance.current = 0;
      onPinchEnd?.();
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isPinching,
  };
};

// Combined gesture hook for cards
interface CardGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onDoubleTap?: () => void;
  threshold?: number;
}

export const useCardGestures = ({
  onSwipeLeft,
  onSwipeRight,
  onDoubleTap,
  threshold = 100,
}: CardGestureOptions) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStart = useRef<Position | null>(null);
  const lastTap = useRef<number>(0);

  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };

    // Double tap detection
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      onDoubleTap?.();
    }
    lastTap.current = now;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.current || !isDragging) return;

    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const deltaX = currentX - touchStart.current.x;
    const deltaY = currentY - touchStart.current.y;

    setOffset({ x: deltaX, y: deltaY });
    setRotation(deltaX * 0.1); // Slight rotation based on swipe
  };

  const onTouchEnd = () => {
    setIsDragging(false);

    if (Math.abs(offset.x) > threshold) {
      if (offset.x > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    }

    // Reset position
    setOffset({ x: 0, y: 0 });
    setRotation(0);
    touchStart.current = null;
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    offset,
    rotation,
    isDragging,
  };
};
