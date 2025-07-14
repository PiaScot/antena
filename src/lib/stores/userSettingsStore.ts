// src/lib/stores/userSettingsStore.ts
import { createPersistentStore } from './persistentStore';

export type Theme = 'light' | 'dark';
export type FontSize = 'small' | 'medium' | 'large';

export interface UserSettings {
	theme: Theme;
	fontSize: FontSize;
}

export const fontSizeClassMap: Record<FontSize, string> = {
	small: 'text-xs',
	medium: 'text-sm',
	large: 'text-base'
};

const initialSettings: UserSettings = {
	theme: 'light',
	fontSize: 'medium'
};

export const userSettings = createPersistentStore<UserSettings>(
	'user-settings',
	initialSettings
);
