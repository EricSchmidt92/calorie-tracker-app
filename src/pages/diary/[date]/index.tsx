import { MealCategorySummary } from '@/server/api/routers/foodEntries';
import { api } from '@/utils/api';
import {
	useMantineTheme,
	ScrollArea,
	Group,
	RingProgress,
	Center,
	createStyles,
	em,
	Card,
	ActionIcon,
	Divider,
	Modal,
	Input,
	Button,
	SegmentedControl,
	Text,
	Stack,
	Box,
} from '@mantine/core';
import { useDisclosure, useInputState, useDebouncedValue } from '@mantine/hooks';
import { MealCategoryType, FoodItemInfo } from '@prisma/client';
import { DateTime } from 'luxon';
import { NextPage } from 'next';
import Head from 'next/head';

import { useRouter } from 'next/router';
import React, { MouseEventHandler } from 'react';
import * as Icons from 'tabler-icons-react';

type IconName = keyof typeof Icons;

const DiarySummaryPage: NextPage = () => {
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

	const { type, calorieCount, foodItems } = summary;

	const iconName = IconMap[type];
	const Icon = Icons[iconName];

	const { colors } = useMantineTheme();
	const router = useRouter();
	const date = router.query.date;

	const { data, error } = api.footItems.getFoodItemsByName.useQuery(
		{ name: debounced },
		{
			enabled: debounced.length > 0,
		}
	);

	if (!date || Array.isArray(date)) {
		router.push('/');
		return null;
	}

	const dateTime = DateTime.fromISO(date);

	if (!dateTime.isValid) {
		router.push('/');
		return null;
	}
	// dateTime is now a valid ISO date that we can use for the URL

	const handleCardClick = () => {
		router.push(`/diary/${dateTime.toISODate()}/${summary.type}`);
	};

	const handleAddToMealCategory: MouseEventHandler<SVGElement> = event => {
		event.stopPropagation();
		router.push(`/diary/${dateTime.toISODate()}/${summary.type}/`);
		// open();
	};

	const handleOnClose = () => {
		setSearchValue('');
		close();
	};

	return (
		<>
			<Card onClick={handleCardClick}>
				<Stack spacing='xs'>
					<Group position='apart'>
						<Group noWrap>
							<Icon size={35} />
							<Stack spacing={0}>
								<Text fw='bold'>{type}</Text>
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
								onClick={handleAddToMealCategory}
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
										{type}
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
								<Stack>
									{error && <Text color='error.4'>Error fetching food items</Text>}

									{data && data?.map(item => <FoodItemCard key={item.id} foodItem={item} />)}
								</Stack>
							) : (
								<FoodSummaryMainContent />
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

const FoodSummaryMainContent = () => {
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
			{subMenuSelection === 'recent' && <Text>recent view</Text>}
			{subMenuSelection === 'favorites' && <Text>favorites view</Text>}
			{subMenuSelection === 'list' && <DiaryList />}
		</Stack>
	);
};

const DiaryList = () => {
	const router = useRouter();

	return <Text>Diary List is here and the path is: {router.pathname}</Text>;
};

export default DiarySummaryPage;
