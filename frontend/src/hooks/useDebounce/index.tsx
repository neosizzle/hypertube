import { useEffect, useState } from "react";

// @ts-expect-error : cb is any here, we ball
export function useDebounce(cb, delay: number) {
  const [debounceValue, setDebounceValue] = useState(cb);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceValue(cb);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [cb, delay]);
  return (debounceValue);
}