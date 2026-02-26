import { configureStore } from '@reduxjs/toolkit';
import courseReducer from './courseSlice';
import { localStorageSyncMiddleware } from './middleware/localStorageSync';

export const store = configureStore({
    reducer: {
        course: courseReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(localStorageSyncMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
