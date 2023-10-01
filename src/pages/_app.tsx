import '@mantine/core/styles.css';
import classes from './index.module.css';

import { themeColors } from '@/constants/colors';
import '@/styles/globals.css';
import { api } from '@/utils/api';
import {
	ActionIcon,
	AppShell,
	Group,
	MantineProvider,
	Modal,
	SimpleGrid,
	Stack,
	Text,
	UnstyledButton,
	useMantineTheme,
	createTheme,
	CSSVariablesResolver,
	rem,
	Box,
} from '@mantine/core';
import { type Session } from 'next-auth';
import { SessionProvider, useSession } from 'next-auth/react';
import { AppProps } from 'next/app';

import { NextPage } from 'next';
import { ReactElement, ReactNode } from 'react';

import { IconMap } from '@/utils/mealCategoryUtils';
import { useDisclosure } from '@mantine/hooks';
import { DateTime } from 'luxon';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as Icons from 'tabler-icons-react';
import Link from 'next/link';

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
					<AppShell
						header={{ height: rem(75) }}
						footer={{ height: rem(75) }}
						withBorder={false}
						padding={disableAppShell ? 0 : 'lg'}
						disabled={disableAppShell}
					>
						<Header />
						<AppShell.Main>{getLayout(<Component {...pageProps} />)}</AppShell.Main>
						<Footer />
					</AppShell>
				</MantineProvider>
			</SessionProvider>
		</>
	);
};

export default api.withTRPC(MyApp);

const Header = () => {
	const { colors } = useMantineTheme();
	const router = useRouter();
	const active = router.pathname === '/profile';
	const primaryColor = colors.primaryPink[3];
	const color = active ? primaryColor : colors.dark[0];

	return (
		<AppShell.Header color='dark.6'>
			<Group justify='space-between' p='lg'>
				<Box>{}</Box>

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

// TODO: look at chartjs
const Footer = () => {
	const { data: sessionData } = useSession();
	const { colors } = useMantineTheme();
	const { pathname, ...router } = useRouter();
	const [opened, { open, close }] = useDisclosure(false);
	const { data: mealCategoryData } = api.mealCategory.getAll.useQuery();
	const dateQueryParam = router.query.date as string;
	const date = DateTime.fromISO(dateQueryParam).toISODate();

	const parsedIsoDate = date ? date : DateTime.now().toISODate();

	if (!sessionData?.user) return undefined;

	const primaryColor = colors.primaryPink[3];
	const buttonBackgroundColor = colors.neutral[6];

	return (
		<AppShell.Footer>
			<>
				<Group
					align='start'
					bg='neutral.6'
					pt={2}
					pb='md'
					style={{
						zIndex: 2,
						justifyContent: 'space-evenly',
					}}
				>
					<NavButton
						onClick={() => router.push(`/diary/${DateTime.now().toISODate()}`)}
						active={pathname.startsWith('/diary')}
						iconName='Book'
					>
						Diary
					</NavButton>

					<NavButton
						iconName='CirclePlus'
						size={55}
						color={buttonBackgroundColor}
						fill={primaryColor}
						strokeWidth={1}
						onClick={open}
					/>

					<NavButton
						onClick={() => router.push('/progress')}
						active={pathname === '/progress'}
						iconName='ChartLine'
					>
						Progress
					</NavButton>
				</Group>
				<Modal
					opened={opened}
					onClose={close}
					withCloseButton={false}
					yOffset='55%'
					overlayProps={{
						color: colors.dark[9],
						opacity: 0.95,
						blur: 10,
					}}
				>
					<Stack h='20rem' justify='space-between' align='center'>
						<SimpleGrid cols={2} spacing='xl' verticalSpacing='xl' w='80%'>
							{mealCategoryData?.map(({ type, id }) => (
								<ModalMenuButton
									key={id}
									iconName={IconMap[type]}
									title={type}
									onClick={() => {
										close();
										router.push(`/diary/${parsedIsoDate}/${type}`);
									}}
								>
									{type}
								</ModalMenuButton>
							))}
						</SimpleGrid>

						<ActionIcon
							variant='filled'
							color='primaryPink'
							size='lg'
							radius='xl'
							aria-label='close'
						>
							<Icons.X size='1.3rem' strokeWidth={2.25} />
						</ActionIcon>
					</Stack>
				</Modal>
			</>
		</AppShell.Footer>
	);
};

const ModalMenuButton = ({
	iconName,
	children,
	title,
	onClick,
}: {
	iconName: keyof typeof Icons;
	children: string;
	title: string;
	onClick: () => void;
}) => {
	const Icon = Icons[iconName];

	return (
		<Stack align='center' gap='xs'>
			<ActionIcon
				aria-label={title}
				variant='filled'
				color='purple.3'
				radius='xl'
				size='xl'
				onClick={onClick}
			>
				<Icon size='2.125rem' strokeWidth={2.25} />
			</ActionIcon>
			<Text>{children}</Text>
		</Stack>
	);
};

const NavButton = ({
	children,
	iconName,
	size,
	active,
	onClick,
	...props
}: {
	iconName: keyof typeof Icons;
	children?: ReactNode;
	size?: number;
	fill?: string;
	color?: string;
	active?: boolean;
	strokeWidth?: number;
	onClick?: () => void;
}) => {
	const Icon = Icons[iconName];
	const { colors } = useMantineTheme();
	const primaryColor = colors.primaryPink[3];
	const color = active ? primaryColor : colors.dark[0];

	return (
		<UnstyledButton onClick={onClick} className={classes.flex1}>
			<Stack align='center' justify='flex-start' gap={0}>
				<Icon size={size ?? 40} color={color} {...props} />
				{children && <Text size='xs'>{children}</Text>}
			</Stack>
		</UnstyledButton>
	);
};
