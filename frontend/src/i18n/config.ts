export type Locale = (typeof locales)[number];

export const locales: string[] = ['en', 'ms'] as const;
export const defaultLocale: Locale = 'en';