import '@mantine/core/styles.css';
import 'webrtc-adapter';

import { themeColors } from '@/constants/colors';
import '@/styles/globals.css';
import { api } from '@/utils/api';
import {
	ActionIcon,
	AppShell,
	Box,
	CSSVariablesResolver,
	Center,
	Group,
	MantineProvider,
	createTheme,
	rem,
	useMantineTheme,
} from '@mantine/core';
import { type Session } from 'next-auth';
import { SessionProvider, signIn, useSession } from 'next-auth/react';
import { AppProps } from 'next/app';

import { NextPage } from 'next';
import { ReactElement, ReactNode, useEffect } from 'react';

import Footer from '@/components/layout/Footer';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import * as Icons from 'tabler-icons-react';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
	getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
	Component: NextPageWithLayout;
	session: Session | null;
};

const neutral6 = 'var(--mantine-color-neutral-6)';
const base6 = 'var(--mantine-color-base-6)';

const theme = createTheme({
	colors: themeColors,
	primaryColor: 'primaryPink',
	primaryShade: 3,
	components: {
		Card: {
			styles: {
				root: {
					backgroundColor: neutral6,
					color: '#F8F8F2',
				},
			},
		},
		Modal: {
			styles: {
				header: {
					backgroundColor: neutral6,
				},
				content: {
					backgroundColor: base6,
				},
			},
		},
		Input: {
			styles: {
				input: {
					backgroundColor: base6,
				},
			},
		},
		SegmentedControl: {
			styles: {
				root: {
					backgroundColor: 'var(--mantine-color-base-4)',
				},
				controlActive: {
					backgroundColor: neutral6,
				},
			},
		},
		Footer: {
			styles: {
				root: {
					backgroundColor: neutral6,
				},
			},
		},
		Paper: {
			styles: {
				root: {
					backgroundColor: neutral6,
					color: '#F8F8F2',
				},
			},
		},
	},
});

const resolver: CSSVariablesResolver = theme => ({
	variables: {
		'--mantine-color-body': theme.colors.base[6],
	},
	dark: {
		'--mantine-color-body': theme.colors.base[6],
	},
	light: {},
});

const MyApp = ({ Component, pageProps: { session, ...pageProps } }: AppPropsWithLayout) => {
	const { pathname } = useRouter();
	const disableAppShell = pathname.startsWith('/diary/[date]/[mealCategory]');

	const getLayout = Component.getLayout ?? (page => page);
	return (
		<>
			<Head>
				<title>Calorie Tracker</title>
				<meta name='description' content='For helping your diet stay on track' />
				<link rel='icon' href='/favicon.ico' />
				<meta
					name='viewport'
					content='minimum-scale=1, initial-scale=1, width=device-width, maximum-scale=1, user-scalable=no'
				/>
			</Head>
			<SessionProvider session={session}>
				<MantineProvider theme={theme} cssVariablesResolver={resolver} defaultColorScheme='dark'>
					<AuthWrapper Component={Component}>
						<AppShell
							header={{ height: rem(75) }}
							footer={{ height: rem(75) }}
							withBorder={false}
							disabled={disableAppShell}
						>
							<Header />
							<AppShell.Main>
								<Component {...pageProps} />
							</AppShell.Main>
							<Footer />
						</AppShell>
					</AuthWrapper>
				</MantineProvider>
			</SessionProvider>
		</>
	);
};

export default api.withTRPC(MyApp);

const Header = () => {
	const { colors } = useMantineTheme();
	const router = useRouter();
	const { data: sessionData } = useSession();
	const active = router.pathname === '/profile';
	const primaryColor = colors.primaryPink[3];
	const color = active ? primaryColor : colors.dark[0];

	if (!sessionData?.user) return undefined;
	return (
		<AppShell.Header color='dark.6'>
			<Group justify='space-between' p='lg'>
				<Box></Box>

				<Box></Box>
				<Box>
					<ActionIcon
						component={Link}
						size='lg'
						href='/profile'
						variant='subtle'
						aria-label='profile link'
					>
						<Icons.User color={color} size={25} strokeWidth={2.5} />
					</ActionIcon>
				</Box>
			</Group>
		</AppShell.Header>
	);
};

const AuthWrapper = ({
	children,
	Component,
}: {
	children: ReactNode;
	Component: NextPageWithLayout & { isPublic?: boolean };
}) => {
	const { data: session, status } = useSession();
	const router = useRouter();
	const isUser = !!session?.user;
	const isPublicPage = Component.isPublic === true;

	useEffect(() => {
		if (status === 'loading') return;
		router.route;
		if (!isUser && !isPublicPage) signIn();
	}, [isUser, status, router, isPublicPage]);

	if (isUser || isPublicPage) {
		return children;
	}

	return <div>Loading....</div>;
};

export const withAuth = (WrappedComponent: NextPage) => {
	const AuthenticatedComponent: NextPage = props => {
		const { data: session, status } = useSession();
		const router = useRouter();

		useEffect(() => {
			if (status !== 'loading' && !session) {
				router.push('/');
			}
		});

		if (status === 'loading') return <Center>Loading...</Center>;

		return <WrappedComponent {...props} />;
	};

	return AuthenticatedComponent;
};
