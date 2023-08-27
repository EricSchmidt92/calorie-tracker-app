import { themeColors } from '@/constants/colors';
import '@/styles/globals.css';
import { api } from '@/utils/api';
import {
	AppShell,
	Group,
	MantineProvider,
	Stack,
	Text,
	UnstyledButton,
	useMantineTheme,
} from '@mantine/core';
import { type Session } from 'next-auth';
import { SessionProvider, useSession } from 'next-auth/react';
import { AppProps } from 'next/app';

import { NextPage } from 'next';
import { ReactElement, ReactNode } from 'react';

import { useRouter } from 'next/router';
import * as Icons from 'tabler-icons-react';

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
	getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
	Component: NextPageWithLayout;
	session: Session | null;
};

const MyApp = ({ Component, pageProps: { session, ...pageProps } }: AppPropsWithLayout) => {
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
						body: {
							backgroundColor: theme.colors.base[6],
						},
						backgroundColor: theme.colors.base[6],
					}),
					components: {
						Card: {
							styles: theme => ({
								root: {
									backgroundColor: theme.colors.neutral[6],
									color: '#F8F8F2',
								},
							}),
						},
					},
				}}
			>
				<AppShell footer={<Footer />}>{getLayout(<Component {...pageProps} />)}</AppShell>
			</MantineProvider>
		</SessionProvider>
	);
};

export default api.withTRPC(MyApp);

const Footer = () => {
	const { data: sessionData } = useSession();
	const { colors } = useMantineTheme();
	const { pathname } = useRouter();

	if (!sessionData?.user) return undefined;

	const primaryColor = colors.success[4];
	const buttonBackgroundColor = colors.neutral[6];

	return (
		<Group
			align='start'
			bg='neutral.6'
			pos='absolute'
			bottom={0}
			left={0}
			right={0}
			h='10%'
			pt={1}
			sx={{
				zIndex: 2,
				justifyContent: 'space-evenly',
			}}
		>
			<NavButton active={pathname === '/'} iconName='Book'>
				Diary
			</NavButton>
			<NavButton
				iconName='CirclePlus'
				size={55}
				color={buttonBackgroundColor}
				fill={primaryColor}
				strokeWidth={1}
			/>
			<NavButton active={pathname === '/progress'} iconName='ChartLine'>
				Progress
			</NavButton>
		</Group>
	);
};

const NavButton = ({
	children,
	iconName,
	size,
	active,
	...props
}: {
	iconName: keyof typeof Icons;
	children?: ReactNode;
	size?: number;
	fill?: string;
	color?: string;
	active?: boolean;
	strokeWidth?: number;
}) => {
	const Icon = Icons[iconName];
	const { colors } = useMantineTheme();
	const primaryColor = colors.success[4];
	const color = active ? primaryColor : colors.dark[0];

	return (
		<UnstyledButton sx={{ flex: 1 }}>
			<Stack align='center' justify='flex-start' spacing={0}>
				<Icon size={size ?? 40} color={color} {...props} />
				{children && <Text size='xs'>{children}</Text>}
			</Stack>
		</UnstyledButton>
	);
};
