import type { JSX } from "hono/jsx";
import { useEffect, useRef } from "hono/jsx/dom";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: string | HTMLElement,
        options: TurnstileOptions,
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
    };
    onloadTurnstileCallback?: () => void;
  }
}

interface TurnstileOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  tabindex?: number;
  action?: string;
  cData?: string;
  appearance?: "always" | "execute" | "interaction-only";
}

export interface TurnstileProps {
  siteKey: string;
  onSuccess?: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
  action?: string;
  cData?: string;
  appearance?: "always" | "execute" | "interaction-only";
  className?: string;
  style?: JSX.CSSProperties;
}

export interface TurnstileInstance {
  reset: () => void;
  remove: () => void;
  getResponse: () => string | undefined;
}

const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js";

let scriptLoaded = false;
let scriptLoading = false;
const loadCallbacks: (() => void)[] = [];

const loadTurnstileScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (scriptLoaded) {
      resolve();
      return;
    }

    if (scriptLoading) {
      loadCallbacks.push(resolve);
      return;
    }

    scriptLoading = true;

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
      loadCallbacks.forEach((cb) => {
        cb();
      });
      loadCallbacks.length = 0;
    };

    script.onerror = () => {
      scriptLoading = false;
      reject(new Error("Failed to load Turnstile script"));
    };

    document.head.appendChild(script);
  });
};

export const Turnstile = (props: TurnstileProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const initTurnstile = async () => {
      try {
        await loadTurnstileScript();

        if (!containerRef.current || !window.turnstile) {
          return;
        }

        // Clear any existing widget
        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        const options: TurnstileOptions = {
          sitekey: props.siteKey,
          callback: props.onSuccess,
          "error-callback": props.onError,
          "expired-callback": props.onExpire,
          theme: props.theme,
          size: props.size,
          action: props.action,
          cData: props.cData,
          appearance: props.appearance,
        };

        widgetIdRef.current = window.turnstile.render(
          containerRef.current,
          options,
        );
      } catch (error) {
        console.error("Failed to initialize Turnstile:", error);
        props.onError?.();
      }
    };

    initTurnstile();

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [props.siteKey]);

  return (
    <div ref={containerRef} className={props.className} style={props.style} />
  );
};

// Hook to access Turnstile instance methods
export const useTurnstile = (ref: {
  current: HTMLDivElement | null;
}): TurnstileInstance | null => {
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (ref.current) {
      // Try to find the widget ID from the container
      const widgetElement = ref.current.querySelector('[id^="cf-chl-widget-"]');
      if (widgetElement) {
        widgetIdRef.current = widgetElement.id.replace("cf-chl-widget-", "");
      }
    }
  }, [ref.current]);

  if (!window.turnstile || !widgetIdRef.current) {
    return null;
  }

  return {
    reset: () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
    remove: () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    },
    getResponse: () => {
      if (widgetIdRef.current && window.turnstile) {
        return window.turnstile.getResponse(widgetIdRef.current);
      }
      return undefined;
    },
  };
};

export default Turnstile;
