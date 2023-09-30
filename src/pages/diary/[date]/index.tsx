import { MealCategorySummary } from '@/server/api/routers/foodDiary';
import { api } from '@/utils/api';
import { IconMap } from '@/utils/mealCategoryUtils';
import {
	ActionIcon,
	Card,
	Center,
	Divider,
	Group,
	RingProgress,
	ScrollArea,
	Stack,
	Text,
	createStyles,
	em,
	useMantineTheme,
} from '@mantine/core';
import { DateTime } from 'luxon';
import { NextPage } from 'next';
import Link from 'next/link';

import { useRouter } from 'next/router';
import { MouseEventHandler } from 'react';
import * as Icons from 'tabler-icons-react';

type IconName = keyof typeof Icons;

const DiarySummaryPage: NextPage = () => {
	const router = useRouter();
	const urlDate = router.query.date as string;
	const { breakpoints } = useMantineTheme();

	const dateTime = urlDate ? DateTime.fromISO(urlDate) : DateTime.now();
	const day = dateTime.toISODate();

	if (!day) {
		router.push('/');
	}

	const {
		data: dailySummary,
		error,
		isLoading,
	} = api.foodDiary.getDailyCalorieSummary.useQuery({
		day: dateTime.toISODate() ?? '',
	});

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

	const dayFragment = isSelectedDayToday
		? `Today, ${dateTime.toFormat('LLL dd')}`
		: dateTime.toLocaleString({ month: 'long', weekday: 'short', day: '2-digit' });

	return (
		<ScrollArea>
			<Stack maw={breakpoints.xs} justify='center' mx='auto'>
				<CalorieSummaryHeader
					caloriesConsumed={dailySummary.caloriesConsumed}
					caloriesLimit={dailySummary.calorieLimit}
				/>
				{dateTime.hasSame(DateTime.now(), 'day')}
				<Group position='apart'>
					<ActionIcon component={Link} href={`/diary/${dateTime.minus({ day: 1 }).toISODate()}`}>
						<Icons.ChevronLeft />
					</ActionIcon>
					<Text>{dayFragment}</Text>
					<ActionIcon component={Link} href={`/diary/${dateTime.plus({ day: 1 }).toISODate()}`}>
						<Icons.ChevronRight />
					</ActionIcon>
				</Group>
				{/* TODO: Change based on some param for the day */}
				{dailySummary?.mealCategorySummaries?.map(dailySummary => (
					<MealSummaryCard key={dailySummary.id} summary={dailySummary} />
				))}
			</Stack>
		</ScrollArea>
	);
};

interface CalorieSummaryHeaderProps {
	caloriesLimit: number;
	caloriesConsumed: number;
}

const CalorieSummaryHeader = ({ caloriesConsumed, caloriesLimit }: CalorieSummaryHeaderProps) => {
	const calorieLimitPercentage = Math.round((caloriesConsumed / caloriesLimit) * 100);
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
				sections={[{ value: calorieLimitPercentage, color: 'primaryPink.3' }]}
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
	const { classes } = useStyles();

	const { type, calorieCount, foodItems } = summary;

	const iconName = IconMap[type];
	const Icon = Icons[iconName];

	const { colors } = useMantineTheme();
	const router = useRouter();
	const date = router.query.date;

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

	// TODO: look into swiping features
	// TODO: can I get calorie info from api based on barcode?

	const handleAddToMealCategory: MouseEventHandler<SVGElement> = event => {
		event.stopPropagation();
		router.push(`/diary/${dateTime.toISODate()}/${summary.type}/edit`);
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
		</>
	);
};

export default DiarySummaryPage;
