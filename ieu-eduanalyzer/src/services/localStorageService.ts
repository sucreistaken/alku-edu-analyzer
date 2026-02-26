const STORAGE_KEY = 'alku_edu_state';

export const saveState = (state: unknown): void => {
    try {
        const serialized = JSON.stringify(state);
        localStorage.setItem(STORAGE_KEY, serialized);
    } catch (err) {
        console.error('localStorage kaydetme hatasi:', err);
    }
};

export const loadState = (): unknown | undefined => {
    try {
        const serialized = localStorage.getItem(STORAGE_KEY);
        if (serialized === null) return undefined;
        return JSON.parse(serialized);
    } catch (err) {
        console.error('localStorage okuma hatasi:', err);
        return undefined;
    }
};

export const clearState = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
        console.error('localStorage temizleme hatasi:', err);
    }
};
