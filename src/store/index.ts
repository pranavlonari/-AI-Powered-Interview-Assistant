import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import interviewReducer from "./interviewSlice";

const persistConfig = {
  key: "ai-interview-assistant",
  version: 1,
  storage,
  whitelist: ["candidates", "currentCandidate", "showWelcomeBack"], // Only persist these fields
};

const persistedReducer = persistReducer(persistConfig, interviewReducer);

export const store = configureStore({
  reducer: {
    interview: persistedReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
