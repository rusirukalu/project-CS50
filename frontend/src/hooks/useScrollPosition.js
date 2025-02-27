import { useState, useEffect, useRef } from 'react';

export function useScrollPosition() {
  const prevScrollY = useRef(0);
  const [scrollState, setScrollState] = useState({
    scrollY: 0,
    scrollDirection: 'up',
    isAtTop: true,
  });

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - prevScrollY.current;

      setScrollState(prev => ({
        scrollY: currentScrollY,
        scrollDirection: Math.abs(delta) > 20 ? (delta > 0 ? 'down' : 'up') : prev.scrollDirection,
        isAtTop: currentScrollY < 100,
      }));

      prevScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollState;
}