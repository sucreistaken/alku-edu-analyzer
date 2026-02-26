import { Middleware } from '@reduxjs/toolkit';
import { saveState } from '../../services/localStorageService';

export const localStorageSyncMiddleware: Middleware = store => next => action => {
    const result = next(action);
    const state = store.getState();
    saveState(state.course);
    return result;
};
