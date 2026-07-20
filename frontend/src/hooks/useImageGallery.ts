import { useState, useRef, useEffect, useCallback } from 'react';
import { useSwipeBack } from './useSwipeBack';

export function useImageGallery(images: string[]) {
  // Fullscreen image state
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [swipeTranslation, setSwipeTranslation] = useState(0);

  // Pinch-to-zoom state
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(1);
  const isPinchingRef = useRef(false);

  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Drag to scroll state for horizontal gallery
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);

  const closeFullscreen = useCallback(() => {
    setFullscreenIndex(null);
  }, []);

  useEffect(() => {
    if (fullscreenIndex !== null) {
      document.body.style.overflow = 'hidden';
      // Push a history state so browser back / Android back button can close the gallery
      window.history.pushState({ galleryOpen: true }, '');
      // Auto focus container to listen for keyboard events
      setTimeout(() => {
        fullscreenContainerRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = 'unset';
      setScale(1);
      setOffset({ x: 0, y: 0 });
      setSwipeTranslation(0);
      if (window.history.state && window.history.state.galleryOpen) {
        window.history.back();
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [fullscreenIndex]);

  // Browser back button / Android back gesture → close gallery
  useEffect(() => {
    if (fullscreenIndex === null) return;
    const onPopState = () => closeFullscreen();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [fullscreenIndex, closeFullscreen]);

  // Swipe-right from left edge → consume the pushState entry → popstate closes gallery
  useSwipeBack({
    isActive: fullscreenIndex !== null,
    onSwipe: () => window.history.back(),
  });

  const handleNextImage = () => {
    if (fullscreenIndex === null) return;
    if (fullscreenIndex < images.length - 1) {
      setFullscreenIndex(fullscreenIndex + 1);
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  };

  const handlePrevImage = () => {
    if (fullscreenIndex === null) return;
    if (fullscreenIndex > 0) {
      setFullscreenIndex(fullscreenIndex - 1);
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  };

  const handleDoubleTap = () => {
    if (scale > 1) {
      setScale(1);
      setOffset({ x: 0, y: 0 });
    } else {
      setScale(2.5);
      setOffset({ x: 0, y: 0 });
    }
  };

  const handleFullscreenPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only left click / touch
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingImage(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleFullscreenPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingImage) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (scale > 1) {
      // Pan the image itself
      setOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    } else {
      // Swipe visual preview
      if (images.length > 1) {
        setSwipeTranslation(dx);
      }
    }
  };

  const handleFullscreenPointerUp = (e: React.PointerEvent) => {
    if (!isDraggingImage) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      // Ignore capture release errors
    }
    setIsDraggingImage(false);

    if (scale === 1 && images.length > 1 && fullscreenIndex !== null) {
      const threshold = 80;
      if (swipeTranslation < -threshold && fullscreenIndex < images.length - 1) {
        handleNextImage();
      } else if (swipeTranslation > threshold && fullscreenIndex > 0) {
        handlePrevImage();
      }
    }
    setSwipeTranslation(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setFullscreenIndex(null);
    } else if (e.key === 'ArrowRight') {
      handleNextImage();
    } else if (e.key === 'ArrowLeft') {
      handlePrevImage();
    }
  };

  const handleFullscreenContainerClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setFullscreenIndex(null);
    }
  };

  // --- Pinch-to-zoom touch handlers ---
  const getPinchDistance = (touches: React.TouchList): number => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isPinchingRef.current = true;
      pinchStartDistanceRef.current = getPinchDistance(e.touches);
      pinchStartScaleRef.current = scale;
      // Prevent swipe logic from kicking in
      setIsDraggingImage(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinchingRef.current && pinchStartDistanceRef.current !== null) {
      e.preventDefault();
      const currentDistance = getPinchDistance(e.touches);
      const ratio = currentDistance / pinchStartDistanceRef.current;
      const newScale = Math.min(4, Math.max(1, pinchStartScaleRef.current * ratio));
      setScale(newScale);
      // If pinching back to 1 reset offset
      if (newScale <= 1) {
        setOffset({ x: 0, y: 0 });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      isPinchingRef.current = false;
      pinchStartDistanceRef.current = null;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !scrollContainerRef.current) return;
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.clientX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    setIsDragging(false);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !scrollContainerRef.current) return;
    setIsDragging(false);

    const dragDistance = (e.clientX - scrollContainerRef.current.offsetLeft) - startX;
    const containerWidth = scrollContainerRef.current.clientWidth;
    
    if (Math.abs(dragDistance) > 50) {
      const direction = dragDistance < 0 ? 1 : -1;
      const currentIndex = Math.round(scrollLeft / containerWidth);
      const nextIndex = Math.max(0, Math.min(currentIndex + direction, images.length - 1));
      
      scrollContainerRef.current.scrollTo({
        left: nextIndex * containerWidth,
        behavior: 'smooth'
      });
    } else {
      const currentIndex = Math.round(scrollLeft / containerWidth);
      scrollContainerRef.current.scrollTo({
        left: currentIndex * containerWidth,
        behavior: 'smooth'
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || e.pointerType !== 'mouse' || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.clientX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX);
    
    if (Math.abs(walk) > 5) {
      setHasDragged(true);
    }
    
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleImageClick = (idx: number) => {
    if (!hasDragged) {
      setFullscreenIndex(idx);
    }
  };

  return {
    fullscreenIndex,
    setFullscreenIndex,
    scale,
    offset,
    swipeTranslation,
    isDraggingImage,
    fullscreenContainerRef,
    scrollContainerRef,
    isDragging,
    handleNextImage,
    handlePrevImage,
    handleDoubleTap,
    handleFullscreenPointerDown,
    handleFullscreenPointerMove,
    handleFullscreenPointerUp,
    handleKeyDown,
    handleFullscreenContainerClick,
    handlePointerDown,
    handlePointerLeave,
    handlePointerUp,
    handlePointerMove,
    handleImageClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
