import {getRequestConfig} from 'next-intl/server';
import { getUserLocale } from '@/services/locale';

export default getRequestConfig(async () => {
  
  // read from cookies
  const locale = await getUserLocale()

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});

// https://next-intl.dev/docs/getting-started/app-router/without-i18n-routing