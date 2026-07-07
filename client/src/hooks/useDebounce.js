import { useEffect, useRef } from 'react';

/**
 * Debounce a value by the given delay.
 * @param {*} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {*} Debounced value
 */
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = [
    typeof value === 'string' ? value : value,
    () => {},
  ];

  const { useState } = require('react');
  const [debounced, setDebounced] = useState(value);
  const timer = useRef(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer.current);
  }, [value, delay]);

  return debounced;
};

export default useDebounce;
