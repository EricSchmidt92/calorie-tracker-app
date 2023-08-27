import { Tuple, DefaultMantineColor } from '@mantine/core';
import { themeColors } from '@/constants/colors';
type ExtendedCustomColors =
	| 'primaryPink'
	| 'purple'
	| 'accent'
	| 'neutral'
	| 'base'
	| 'info'
	| 'success'
	| 'warning'
	| 'error'
	| DefaultMantineColor;

declare module '@mantine/core' {
	export interface MantineThemeColorsOverride {
		colors: Record<ExtendedCustomColors, Tuple<string, 10>>;
	}
}
