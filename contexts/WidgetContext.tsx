
import * as React from "react";
import { createContext, useCallback, useContext } from "react";
import { Platform } from "react-native";

let ExtensionStorage: any = null;
if (Platform.OS === 'ios') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const appleTargets = require("@bacons/apple-targets");
    ExtensionStorage = appleTargets.ExtensionStorage;
  } catch (error) {
    console.log('ExtensionStorage not available:', error);
  }
}

type WidgetContextType = {
  refreshWidget: () => void;
};

const WidgetContext = createContext<WidgetContextType | null>(null);

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (Platform.OS === 'ios' && ExtensionStorage) {
      try {
        ExtensionStorage.reloadWidget();
      } catch (error) {
        console.log('Error reloading widget:', error);
      }
    }
  }, []);

  const refreshWidget = useCallback(() => {
    if (Platform.OS === 'ios' && ExtensionStorage) {
      try {
        ExtensionStorage.reloadWidget();
      } catch (error) {
        console.log('Error reloading widget:', error);
      }
    }
  }, []);

  return (
    <WidgetContext.Provider value={{ refreshWidget }}>
      {children}
    </WidgetContext.Provider>
  );
}

export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidget must be used within a WidgetProvider");
  }
  return context;
};
