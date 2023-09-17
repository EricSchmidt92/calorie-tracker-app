import DiaryList from '@/components/FoodDiary/DiaryList';
import { ActionIcon, Box, Button, Stack, Text } from '@mantine/core';
import { MealCategoryType } from '@prisma/client';
import { DateTime } from 'luxon';
import { NextPage } from 'next';
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

	return (
		<Stack justify='space-between' h='100%'>
			<Box>
				<Stack h='80%' bg='accent.4' m='-md' p='md'>
					<ActionIcon onClick={router.back}>
						<ChevronLeft />
					</ActionIcon>

					<Stack spacing={0} align='center'>
						<Text tt='capitalize' fw='bold' size='xl'>
							{category}
						</Text>
						<Text size='sm'>{dateStr}</Text>
					</Stack>
				</Stack>

				<DiaryList />
			</Box>

			<Box pos='sticky' bottom={0} left={20} right={20} bg='base.6' h={120}>
				<Button fullWidth onClick={router.back} h={50} tt='uppercase'>
					Add More Food
				</Button>
			</Box>
		</Stack>
	);
};

export default MealCategoryPage;
