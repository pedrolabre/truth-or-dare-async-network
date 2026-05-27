import React, { createContext, useContext } from 'react';

import {
  useRecoveryFlow,
  type RecoveryFlow,
  type UseRecoveryFlowOptions,
} from '../hooks/useRecoveryFlow';

const RecoveryFlowContext = createContext<RecoveryFlow | null>(null);

type RecoveryFlowProviderProps = UseRecoveryFlowOptions & {
  children: React.ReactNode;
};

export function RecoveryFlowProvider({
  children,
  ...options
}: RecoveryFlowProviderProps) {
  const flow = useRecoveryFlow(options);

  return (
    <RecoveryFlowContext.Provider value={flow}>
      {children}
    </RecoveryFlowContext.Provider>
  );
}

export function useRecoveryFlowContext() {
  const context = useContext(RecoveryFlowContext);

  if (!context) {
    throw new Error(
      'useRecoveryFlowContext deve ser usado dentro de RecoveryFlowProvider',
    );
  }

  return context;
}
