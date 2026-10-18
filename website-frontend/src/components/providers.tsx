"use client";

import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";

interface ProvidersProps {
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
      {children}
    </NextIntlClientProvider>
  );
}
