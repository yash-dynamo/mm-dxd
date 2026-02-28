'use client';

import { useEffect, useRef } from 'react';

type EventCallback = (event: Event) => void;

export const useEventListener = (
  eventName: string,
  handler: EventCallback,
  element: Window | Document | HTMLElement = window,
) => {
  // Create a ref that stores the handler
  const savedHandler = useRef<EventCallback>(handler);

  // Update ref.current value if handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Make sure element supports addEventListener
    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    // Create event listener that calls handler function stored in ref
    const eventListener: EventCallback = (event) => {
      savedHandler.current(event);
    };

    // Add event listener
    element.addEventListener(eventName, eventListener);

    // Remove event listener on cleanup
    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
};
