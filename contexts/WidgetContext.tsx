
import * as React from "react";
import { createContext, useCallback, useContext } from "react";
import { Platform } from "react-native";

// Only import ExtensionStorage on iOS
let ExtensionStorage: any = null;
if (Platform.OS === 'ios') {
  try {
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
  // Update widget state whenever what we want to show changes
  React.useEffect(() => {
    // Only run on iOS where widgets are supported
    if (Platform.OS === 'ios' && ExtensionStorage) {
      try {
        // Refresh widget
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
