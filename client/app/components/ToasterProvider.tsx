"use client";

import { Toaster } from 'react-hot-toast';

/**
 * Global toaster provider for notifications
 * Renders react-hot-toast <Toaster/> at app root.
 */
export default function ToasterProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: 'var(--color-surface)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)'
        },
        success: {
          style: {
            borderLeft: '4px solid var(--color-green)'
          },
          iconTheme: {
            primary: 'var(--color-green)',
            secondary: 'var(--color-background)'
          }
        },
        error: {
          style: {
            borderLeft: '4px solid var(--color-error)'
          },
          iconTheme: {
            primary: 'var(--color-error)',
            secondary: 'var(--color-background)'
          }
        },
        loading: {
          style: {
            borderLeft: '4px solid var(--color-primary)'
          }
        }
      }}
    />
  );
}


