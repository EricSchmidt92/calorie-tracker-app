import { api } from '@/utils/api';
import { ActionIcon, Group, ScrollArea, Stack, Text, useMantineTheme } from '@mantine/core';
import { DateTime } from 'luxon';
import { NextPage } from 'next';
import Link from 'next/link';

import { CalorieSummaryHeader, MealSummaryCard, WaterTrackingCard } from '@/components/FoodDiary';
import { useRouter } from 'next/router';
import * as Icons from 'tabler-icons-react';

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
		<ScrollArea type='never'>
			<Stack maw={breakpoints.xs} justify='center' mx='auto'>
				<CalorieSummaryHeader
					caloriesConsumed={dailySummary.caloriesConsumed}
					caloriesLimit={dailySummary.calorieLimit}
				/>
				{dateTime.hasSame(DateTime.now(), 'day')}
				<Group justify='space-between'>
					<ActionIcon
						aria-label='previous day'
						variant='subtle'
						component={Link}
						href={`/diary/${dateTime.minus({ day: 1 }).toISODate()}`}
					>
						<Icons.ChevronLeft />
					</ActionIcon>
					<Text>{dayFragment}</Text>
					<ActionIcon
						aria-label='next day'
						variant='subtle'
						component={Link}
						href={`/diary/${dateTime.plus({ day: 1 }).toISODate()}`}
					>
						<Icons.ChevronRight />
					</ActionIcon>
				</Group>

				{dailySummary?.mealCategorySummaries?.map(dailySummary => (
					<MealSummaryCard key={dailySummary.id} summary={dailySummary} />
				))}

				<WaterTrackingCard />
			</Stack>
		</ScrollArea>
	);
};

export default DiarySummaryPage;
