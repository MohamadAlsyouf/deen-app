/**
 * WebHomeScreen - Entry point for the web dashboard
 * Renders the persistent sidebar shell with content areas
 */

import React from 'react';
import { WebAppShell } from '@/components/web';

export const WebHomeScreen: React.FC = () => {
  return <WebAppShell initialScreen="home" />;
};
