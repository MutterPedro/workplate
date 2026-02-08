import React, { createContext, useContext } from "react";
import type { CalendarService } from "./calendar-service";
import { TauriCalendarService } from "./calendar-service";

const CalendarContext = createContext<CalendarService>(new TauriCalendarService());

export function CalendarProvider({
  service,
  children,
}: {
  service: CalendarService;
  children: React.ReactNode;
}) {
  return (
    <CalendarContext.Provider value={service}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendarService(): CalendarService {
  return useContext(CalendarContext);
}
