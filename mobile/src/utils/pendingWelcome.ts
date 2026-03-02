interface WelcomeParams {
  displayName: string;
  isNewUser: boolean;
}

let pending: WelcomeParams | null = null;

export const setPendingWelcome = (params: WelcomeParams) => {
  pending = params;
};

export const consumePendingWelcome = (): WelcomeParams | null => {
  const p = pending;
  pending = null;
  return p;
};

export const hasPendingWelcome = (): boolean => pending !== null;
