export { };

declare global {
  interface TelegramWebApp {
    ready: () => void;
    expand: () => void;
    initDataUnsafe?: {
      user?: {
        id: number;
        first_name?: string;
        username?: string;
        language_code?: string;
        is_premium?: boolean;
        photo_url?: string;
      };
      start_param?: string;
    };
    HapticFeedback?: {
      selectionChanged: () => void;
      notificationOccurred: (type: 'success' | 'warning' | 'error') => void;
    };
    openTelegramLink: (url: string) => void;
    openLink: (url: string) => void;
  }

  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}
