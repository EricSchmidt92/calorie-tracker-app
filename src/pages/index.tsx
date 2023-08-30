import { MealCategorySummary } from '@/server/api/routers/foodEntries';
import { api } from '@/utils/api';
import {
	ActionIcon,
	Box,
	Button,
	Card,
	Center,
	Divider,
	Group,
	Input,
	Modal,
	RingProgress,
	ScrollArea,
	SegmentedControl,
	Stack,
	Text,
	createStyles,
	em,
	useMantineTheme,
} from '@mantine/core';
import { useDebouncedValue, useDisclosure, useInputState } from '@mantine/hooks';
import { FoodItemInfo, MealCategoryType } from '@prisma/client';
import { DateTime } from 'luxon';
import { signIn, signOut, useSession } from 'next-auth/react';
import Head from 'next/head';
import * as Icons from 'tabler-icons-react';
import { NextPageWithLayout } from './_app';
import styles from './index.module.css';
import { useRouter } from 'next/router';

type IconName = keyof typeof Icons;

const Home: NextPageWithLayout = () => {
	const { data: session } = useSession();

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
			{!session?.user ? (
				<Button onClick={() => void signIn()}>Login to use app</Button>
			) : (
				<HomeAuthenticated />
			)}
		</>
	);
};

const HomeAuthenticated = () => {
	const dateTime = DateTime.now();
	const {
		data: dailySummary,
		error,
		isLoading,
	} = api.foodEntries.getDailyCalorieSummary.useQuery({
		day: DateTime.now().toISODate() ?? '',
	});

	const { breakpoints } = useMantineTheme();

	if (error) {
		console.error('error getting data: ', error);
	}

	if (isLoading) {
		return <Text>Loading...</Text>;
	}

	if (!dailySummary) {
		return <Text>Error loading data please try again</Text>;
	}

	const isSelectedDayToday = dateTime.hasSame(DateTime.now(), 'day');
	const dayInISODate = dateTime.toISODate(); //TODO:  use this to select new day eventually

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
			{/* <AuthShowcase /> */}
			<ScrollArea>
				<Stack maw={breakpoints.xs} justify='center' mx='auto'>
					<CalorieSummaryHeader
						caloriesConsumed={dailySummary.caloriesConsumed}
						caloriesLimit={dailySummary.calorieLimit}
					/>
					{dateTime.hasSame(DateTime.now(), 'day')}
					<Text>
						{isSelectedDayToday && 'Today, '}
						{dateTime.toFormat('LLL dd')}
					</Text>{' '}
					{/* TODO: Change based on some param for the day */}
					{dailySummary?.mealCategorySummaries?.map(dailySummary => (
						<MealSummaryCard key={dailySummary.id} summary={dailySummary} />
					))}
				</Stack>
			</ScrollArea>
		</>
	);
};

interface CalorieSummaryHeaderProps {
	caloriesLimit: number;
	caloriesConsumed: number;
}

const CalorieSummaryHeader = ({ caloriesConsumed, caloriesLimit }: CalorieSummaryHeaderProps) => {
	return (
		<Group position='center' spacing={0}>
			<HeaderSubText calories={caloriesConsumed} text='eaten' />
			<RingProgress
				label={
					<Center>
						<Stack spacing={0} align='center'>
							<Text size={35} fw='bold'>
								{caloriesLimit - caloriesConsumed}
							</Text>
							<Text size='xs' fw='bold' tt='uppercase'>
								cal left
							</Text>
						</Stack>
					</Center>
				}
				sections={[{ value: caloriesLimit / caloriesConsumed, color: 'primaryPink.3' }]}
				size={200}
				thickness={8}
				rootColor='neutral.4'
				roundCaps
			/>
			<HeaderSubText calories={0} text='burned' />
		</Group>
	);
};

const HeaderSubText = ({ calories, text }: { calories: number; text: string }) => (
	<Stack align='center' spacing={0}>
		<Text size='sm' fw='bold'>
			{calories}
		</Text>
		<Text size='0.7em' fw='bold' tt='uppercase'>
			{text}
		</Text>
	</Stack>
);

interface MealSummaryCardProps {
	summary: MealCategorySummary;
}

const useStyles = createStyles(() => ({
	mealSummaryText: {
		width: 200,

		[`@media (max-width: ${em(370)})`]: {
			width: '100px',
		},
	},

	foodInfoCardText: {
		[`@media (max-width: ${em(370)})`]: {
			width: '180px',
		},

		[`@media (min-width: ${em(371)}) and (max-width: ${em(450)})`]: {
			width: '180px',
		},
	},
}));

const MealSummaryCard = ({ summary }: MealSummaryCardProps) => {
	const [opened, { open, close }] = useDisclosure(false);
	const [searchValue, setSearchValue] = useInputState('');
	const [debounced] = useDebouncedValue(searchValue, 200);
	const IconMap: Record<MealCategoryType, IconName> = {
		Breakfast: 'Coffee',
		Lunch: 'Salad',
		Dinner: 'Soup',
		Snack: 'Cookie',
	};

	const { classes } = useStyles();

	const { name, calorieCount, foodItems } = summary;

	const iconName = IconMap[name];
	const Icon = Icons[iconName];

	const { colors } = useMantineTheme();
	const router = useRouter();

	const { data, error } = api.footItems.getFoodItemsByName.useQuery(
		{ name: debounced },
		{
			enabled: debounced.length > 0,
		}
	);

	const handleOnClose = () => {
		setSearchValue('');
		close();
	};

	return (
		<>
			<Card onClick={() => router.push(`/${summary.name}/${DateTime.now().toISODate()}`)}>
				<Stack spacing='xs'>
					<Group position='apart'>
						<Group noWrap>
							<Icon size={35} />
							<Stack spacing={0}>
								<Text fw='bold'>{name}</Text>
								<Text className={classes.mealSummaryText} truncate size='xs'>
									{foodItems.join(', ')}
								</Text>
							</Stack>
						</Group>
						<ActionIcon size={51}>
							<Icons.CirclePlus
								strokeWidth={1}
								size={50}
								fill={colors.success[3]}
								color={colors.neutral[6]}
								onClick={event => {
									event.stopPropagation();
									open();
								}}
							/>
						</ActionIcon>
					</Group>
					{calorieCount > 0 && (
						<>
							<Divider color={colors.neutral[4]} />
							<Text fw='bold' align='center' size='sm'>
								{calorieCount} calories
							</Text>
						</>
					)}
				</Stack>
			</Card>
			<Modal.Root
				opened={opened}
				onClose={handleOnClose}
				transitionProps={{ transition: 'slide-up', duration: 200 }}
				fullScreen
				styles={() => ({
					body: {
						height: '90%',
					},
				})}
			>
				<Modal.Overlay />

				<Modal.Content>
					<Modal.Header sx={{ justifyContent: 'space-between' }}>
						<Stack w='100%' pb='xs'>
							<Group position='apart'>
								<Modal.CloseButton ml='0' />

								<Modal.Title>
									<Text m='0' fw='bold'>
										{name}
									</Text>
								</Modal.Title>

								<ActionIcon size='sm'>
									<Icons.Dots />
								</ActionIcon>
							</Group>
							<Input
								radius='xl'
								variant='filled'
								icon={<Icons.Search size='1rem' />}
								value={searchValue}
								onChange={setSearchValue}
							/>
						</Stack>
					</Modal.Header>

					<Modal.Body h='84%'>
						<ScrollArea.Autosize mah='100%'>
							<Box h={20}></Box>
							{searchValue ? (
								<>
									{error && <Text color='error.4'>Error fetching food items</Text>}

									{data && data?.map(item => <FoodItemCard key={item.id} foodItem={item} />)}
								</>
							) : (
								<FoodSummaryMainContent summary={summary} />
							)}
							<Box h={70}></Box>
						</ScrollArea.Autosize>

						<Button pos='absolute' bottom={0} left={0} right={0} onClick={handleOnClose}>
							Done
						</Button>
					</Modal.Body>
				</Modal.Content>
			</Modal.Root>
		</>
	);
};

const FoodSummaryMainContent = ({ summary }: { summary: MealCategorySummary }) => {
	const [subMenuSelection, setSubMenuSelection] = useInputState('favorites');
	const { colors } = useMantineTheme();

	return (
		<Stack>
			<SegmentedControl
				radius='xl'
				size='xs'
				value={subMenuSelection}
				onChange={setSubMenuSelection}
				data={[
					{
						value: 'recent',
						label: (
							<Center>
								<Icons.History
									color={subMenuSelection === 'recent' ? colors.success[3] : undefined}
								/>
							</Center>
						),
					},
					{
						value: 'favorites',
						label: (
							<Center>
								<Icons.Heart
									color={subMenuSelection === 'favorites' ? colors.success[3] : undefined}
								/>
							</Center>
						),
					},
					{
						value: 'list',
						label: (
							<Center>
								<Icons.List color={subMenuSelection === 'list' ? colors.success[3] : undefined} />
							</Center>
						),
					},
				]}
			/>
		</Stack>
	);
};

const FoodItemCard = ({ foodItem }: { foodItem: FoodItemInfo }) => {
	const { name, caloriesPerServing, servingSize, servingUnit } = foodItem;
	const { colors } = useMantineTheme();
	const { classes } = useStyles();
	return (
		<Card p='sm'>
			<Group position='apart'>
				<Stack spacing={0}>
					<Text className={classes.foodInfoCardText} truncate size='sm'>
						{name}
					</Text>
					<Text size='xs'>{caloriesPerServing} cal</Text>
					<Text size='xs'>
						{servingSize}
						{servingUnit}
					</Text>
				</Stack>

				<Icons.CirclePlus
					onClick={() => console.log('you want to add this to your meal category')}
					strokeWidth={1}
					size={50}
					fill={colors.success[3]}
					color={colors.neutral[6]}
				/>
			</Group>
		</Card>
	);
};

function AuthShowcase() {
	return (
		<div className={styles.authContainer}>
			<Button onClick={() => void signOut()}>Sign out</Button>
		</div>
	);
}

export default Home;
