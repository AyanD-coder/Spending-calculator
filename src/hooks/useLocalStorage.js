import { useCallback, useRef, useState } from "react";

export const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    const fallbackValue =
      typeof initialValue === "function" ? initialValue() : initialValue;

    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallbackValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return fallbackValue;
    }
  });
  const valueRef = useRef(value);

  const saveValue = useCallback((valueOrUpdater) => {
    const nextValue =
      typeof valueOrUpdater === "function"
        ? valueOrUpdater(valueRef.current)
        : valueOrUpdater;

    try {
      valueRef.current = nextValue;
      setValue(nextValue);
      localStorage.setItem(key, JSON.stringify(nextValue));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [value, saveValue];
};
