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
	Alert,
	NumberInput,
	Title,
	Button,
	Center,
	NumberInputHandlers,
} from '@mantine/core';
import { type Session } from 'next-auth';
import { SessionProvider, useSession } from 'next-auth/react';
import { AppProps } from 'next/app';

import { NextPage } from 'next';
import { ReactElement, ReactNode, useRef } from 'react';

import { IconMap } from '@/utils/mealCategoryUtils';
import { useDisclosure } from '@mantine/hooks';
import { DateTime } from 'luxon';
import Head from 'next/head';
import { useRouter } from 'next/router';
import * as Icons from 'tabler-icons-react';
import Link from 'next/link';
import { Loader } from '@mantine/core';
import { useForm } from '@mantine/form';

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
						disabled={disableAppShell}
					>
						<Header />
						<AppShell.Main>{<Component {...pageProps} />}</AppShell.Main>
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
	const { data: sessionData } = useSession();
	const active = router.pathname === '/profile';
	const primaryColor = colors.primaryPink[3];
	const color = active ? primaryColor : colors.dark[0];

	if (!sessionData?.user) return undefined;
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

const Footer = () => {
	const { data: sessionData } = useSession();
	const { colors } = useMantineTheme();
	const { pathname, ...router } = useRouter();
	const [opened, { open, close }] = useDisclosure(false);
	const [weightModalOpened, { open: weightModalOpen, close: weightModalClose }] =
		useDisclosure(false);
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
					centered
					h='300px'
					opened={opened}
					onClose={close}
					withCloseButton={false}
					overlayProps={{
						color: colors.dark[9],
						opacity: 0.95,
						blur: 10,
					}}
				>
					<Stack h='20rem' justify='space-between' align='center'>
						<SimpleGrid cols={2} spacing='lg' verticalSpacing='lg' w='80%'>
							<ModalMenuButton
								iconName='ScaleOutline'
								title='Weight'
								onClick={() => {
									close();
									weightModalOpen();
								}}
							>
								Weight
							</ModalMenuButton>
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
							onClick={close}
						>
							<Icons.X size='1.3rem' strokeWidth={2.25} />
						</ActionIcon>
					</Stack>
				</Modal>
				<WeightUpdateModal opened={weightModalOpened} onClose={weightModalClose} />
			</>
		</AppShell.Footer>
	);
};

interface WeightUpdateModalProps {
	opened: boolean;
	onClose: () => void;
}

const WeightUpdateModal = ({ opened, onClose }: WeightUpdateModalProps) => {
	return (
		<Modal opened={opened} onClose={onClose} withCloseButton={false} centered>
			<WeightModalBody onSubmit={onClose} />
		</Modal>
	);
};

const WeightModalBody = ({ onSubmit }: { onSubmit: () => void }) => {
	const { data, isLoading, error } = api.weightDiary.getCurrentWeight.useQuery();

	if (isLoading) {
		return (
			<Center>
				<Loader size='lg' />;
			</Center>
		);
	}

	if (error) {
		console.error(error);
		return (
			<Alert icon={<Icons.AlertCircle />} title='Uh oh!' color='error.4'>
				Something went wrong loading your weight. Please try again!
			</Alert>
		);
	}

	return <WeightModalForm onSubmit={onSubmit} weight={data?.weight ?? 0} />;
};

const WeightModalForm = ({ weight, onSubmit }: { weight: number; onSubmit: () => void }) => {
	const { mutateAsync: updateCurrentWeightMutation } =
		api.weightDiary.updateCurrentWeight.useMutation();

	const form = useForm({
		initialValues: {
			weight,
		},

		validate: {
			weight: value => (value <= 0 ? 'Weight must be a positive number' : null),
		},
	});

	const handlersRef = useRef<NumberInputHandlers>(null);

	const handleSubmit = async (updatedWeight: number) => {
		await updateCurrentWeightMutation(
			{
				updatedWeight,
			},
			{
				onError: err => console.error('error: ', err),
				onSuccess: () => {
					onSubmit();
				},
			}
		);
	};

	return (
		<form onSubmit={form.onSubmit(({ weight }) => handleSubmit(weight))}>
			<Stack h='200px' justify='space-between' align='center'>
				<Title order={3} ta='center'>
					Update your weight
				</Title>

				<Group wrap='nowrap'>
					<ActionIcon
						variant='subtle'
						size='xl'
						radius='xl'
						onClick={() => handlersRef.current?.decrement()}
					>
						<Icons.CircleMinus size={45} />
					</ActionIcon>
					<NumberInput
						{...form.getInputProps('weight')}
						handlersRef={handlersRef}
						decimalScale={1}
						hideControls
					/>

					<ActionIcon
						variant='subtle'
						size='xl'
						radius='xl'
						onClick={() => handlersRef.current?.increment()}
					>
						<Icons.CirclePlus size={45} />
					</ActionIcon>
				</Group>
				<Button
					radius='xl'
					variant='gradient'
					gradient={{ from: 'primaryPink.4', to: 'primaryPink.2' }}
					type='submit'
				>
					Save Changes
				</Button>
			</Stack>
		</form>
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
