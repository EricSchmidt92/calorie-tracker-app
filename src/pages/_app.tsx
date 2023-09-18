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
							Modal: {
								styles: theme => ({
									header: {
										backgroundColor: theme.colors.neutral[6],
									},
									content: {
										backgroundColor: theme.colors.base[6],
									},
								}),
							},
							Input: {
								styles: theme => ({
									input: {
										backgroundColor: theme.colors.base[6],
									},
								}),
							},
							SegmentedControl: {
								styles: theme => ({
									root: {
										backgroundColor: theme.colors.base[4],
									},
									controlActive: {
										backgroundColor: theme.colors.neutral[6],
									},
								}),
							},
						},
					}}
				>
					<AppShell footer={<Footer />}>{getLayout(<Component {...pageProps} />)}</AppShell>
				</MantineProvider>
			</SessionProvider>
		</>
	);
};

export default api.withTRPC(MyApp);

const Footer = () => {
	const { data: sessionData } = useSession();
	const { colors } = useMantineTheme();
	const { pathname, ...router } = useRouter();
	const [opened, { open, close }] = useDisclosure(true); //TODO: don't forget to change this back to false
	const { data: mealCategoryData } = api.mealCategory.getAll.useQuery();
	const dateQueryParam = router.query.date as string;
	const date = DateTime.fromISO(dateQueryParam).toISODate();

	const parsedIsoDate = date ? date : DateTime.now().toISODate();

	if (!sessionData?.user) return undefined;

	if (pathname.startsWith('/diary/[date]/[mealCategory]')) return undefined;

	// const primaryColor = colors.success[4];
	const primaryColor = colors.primaryPink[3];
	const buttonBackgroundColor = colors.neutral[6];

	return (
		<>
			<Group
				align='start'
				bg='neutral.6'
				pos='sticky'
				bottom={0}
				left={0}
				right={0}
				h='12%'
				mih='12%'
				pt={2}
				pb='md'
				sx={{
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
						{mealCategoryData?.map(({ type }) => (
							<ModalMenuButton
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

					<ActionIcon variant='filled' color='primaryPink' size='lg' radius='xl' title='close'>
						<Icons.X size='1.3rem' strokeWidth={2.25} />
					</ActionIcon>
				</Stack>
			</Modal>
		</>
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
		<Stack align='center' spacing='xs'>
			<ActionIcon
				title={title}
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
		<UnstyledButton onClick={onClick} sx={{ flex: 1 }}>
			<Stack align='center' justify='flex-start' spacing={0}>
				<Icon size={size ?? 40} color={color} {...props} />
				{children && <Text size='xs'>{children}</Text>}
			</Stack>
		</UnstyledButton>
	);
};
