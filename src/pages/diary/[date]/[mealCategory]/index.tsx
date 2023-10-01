import DiaryList from '@/components/FoodDiary/DiaryList';
import { api } from '@/utils/api';
import { ActionIcon, Box, Button, Group, Stack, Text } from '@mantine/core';
import { MealCategoryType } from '@prisma/client';
import { DateTime } from 'luxon';
import { NextPage } from 'next';
import Link from 'next/link';
import router, { useRouter } from 'next/router';
import React from 'react';
import { ChevronLeft } from 'tabler-icons-react';

const MealCategoryPage: NextPage = () => {
	const router = useRouter();
	const category = router.query.mealCategory as MealCategoryType;
	const day = router.query.date as string;

	const dt = DateTime.fromISO(day);
	const dateStr = dt.toLocaleString({
		month: 'long',
		day: '2-digit',
		weekday: 'long',
	});

	const {
		data: calorieCountData,
		isError: calorieCountError,
		isLoading: calorieCountLoading,
	} = api.foodDiary.getCalorieCountByDayAndCategory.useQuery({ day, category });

	return (
		<Stack justify='space-between' h='100%'>
			<Box>
				<Stack h='80%' bg='neutral.' p='md' justify='space-between'>
					<ActionIcon aria-label='go back' variant='subtle' component={Link} href='/'>
						<ChevronLeft />
					</ActionIcon>
					<Stack gap={0} align='center'>
						<Text tt='capitalize' fw='bold' size='2rem'>
							{category}
						</Text>
						<Text size='sm'>{dateStr}</Text>
					</Stack>
					<Stack align='center'>
						{calorieCountError && (
							<Text c='error.4'>Error getting calorie count...please try again</Text>
						)}
						{calorieCountLoading && <Text>Calculating calories</Text>}
						{calorieCountData && (
							<Group gap={5} align='baseline'>
								<Text fw='bold' size='1.5rem'>
									{calorieCountData.calorieCount}
								</Text>
								<Text>cal</Text>
							</Group>
						)}
					</Stack>
				</Stack>

				<DiaryList />
			</Box>

			<Box pos='sticky' bottom={0} left={20} right={20} bg='base.6' h={120}>
				<Button
					fullWidth
					component={Link}
					href={`/diary/${day}/${category}/edit`}
					h={50}
					tt='uppercase'
				>
					Add More Food
				</Button>
			</Box>
		</Stack>
	);
};

export default MealCategoryPage;
