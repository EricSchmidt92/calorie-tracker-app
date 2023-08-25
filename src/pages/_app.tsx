import { type Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { AppProps, type AppType } from 'next/app';
import { api } from '@/utils/api';
import '@/styles/globals.css';
import {
	AppShell,
	Box,
	MantineProvider,
	MantineThemeOverride,
	Text,
} from '@mantine/core';
import { themeColors } from '@/constants/colors';
import { Workbox } from 'workbox-window';
import { NextPage } from 'next';
import { ReactElement, ReactNode } from 'react';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
	getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
	Component: NextPageWithLayout;
	session: Session | null;
};

const MyApp = ({
	Component,
	pageProps: { session, ...pageProps },
}: AppPropsWithLayout) => {
	const getLayout = Component.getLayout ?? (page => page);
	return (
		<SessionProvider session={session}>
			<MantineProvider
				withNormalizeCSS
				withGlobalStyles
				theme={{
					colorScheme: 'dark',
					colors: themeColors,
					primaryColor: 'primaryPink',
					primaryShade: 3,
					globalStyles: theme => ({
						backgroundColor: theme.colors.base[6],
					}),
				}}
			>
				<>
					{getLayout(<Component {...pageProps} />)}
					another layout goes here
				</>
			</MantineProvider>
		</SessionProvider>
	);
};

export default api.withTRPC(MyApp);
