import { useMediaQuery } from 'react-responsive';
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from '../../../tailwind.config';

const fullConfig = resolveConfig(tailwindConfig);
const breakpoints = fullConfig.theme.screens;

type BreakpointKey = keyof typeof breakpoints;

/*
  This hook provides a way to access the current tailwind breakpoint inside typescript code, for the purpose of
  responsive design.
  https://stackoverflow.com/questions/59982018/how-do-i-get-tailwinds-active-breakpoint-in-javascript
*/
export function useBreakpoint<K extends BreakpointKey>(breakpointKey: K) {
  const bool = useMediaQuery({
    query: `(min-width: ${breakpoints[breakpointKey]})`,
  });
  const capitalizedKey = breakpointKey[0].toUpperCase() + breakpointKey.substring(1);
  type Key = `is${Capitalize<K>}`;
  return {
    [`is${capitalizedKey}`]: bool,
  } as Record<Key, boolean>;
}