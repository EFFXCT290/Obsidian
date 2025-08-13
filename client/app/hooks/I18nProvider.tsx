'use client';

import React, { createContext, useContext } from 'react';

type I18nResources = Record<string, unknown>;

const I18nContext = createContext<I18nResources | null>(null);

export function I18nProvider({ resources, children }: { resources: I18nResources; children: React.ReactNode }) {
  return <I18nContext.Provider value={resources}>{children}</I18nContext.Provider>;
}

export function useI18nResources(): I18nResources | null {
  return useContext(I18nContext);
}


