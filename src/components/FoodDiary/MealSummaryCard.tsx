import { MealCategorySummary } from '@/server/api/routers/foodDiary';
import classes from '@/styles/diaryIndex.module.css';
import { IconMap } from '@/utils/mealCategoryUtils';
import { ActionIcon, Card, Divider, Group, Stack, Text, useMantineTheme } from '@mantine/core';
import { DateTime } from 'luxon';
import { useRouter } from 'next/router';
import { MouseEventHandler } from 'react';
import * as Icons from 'tabler-icons-react';

interface MealSummaryCardProps {
	summary: MealCategorySummary;
}

const MealSummaryCard = ({ summary }: MealSummaryCardProps) => {
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

	const handleAddToMealCategory: MouseEventHandler<SVGElement> = event => {
		event.stopPropagation();
		router.push(`/diary/${dateTime.toISODate()}/${summary.type}/edit`);
	};

	return (
		<>
			<Card onClick={handleCardClick}>
				<Stack gap='xs'>
					<Group justify='space-between'>
						<Group wrap='nowrap'>
							<Icon size={35} />
							<Stack gap={0}>
								<Text fw='bold'>{type}</Text>
								<Text className={classes.mealSummaryText} truncate size='xs'>
									{foodItems.join(', ')}
								</Text>
							</Stack>
						</Group>
						<ActionIcon size={51} variant='subtle' aria-label={`edit ${summary.type}`}>
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
							<Text fw='bold' ta='center' size='sm'>
								{calorieCount} calories
							</Text>
						</>
					)}
				</Stack>
			</Card>
		</>
	);
};

export default MealSummaryCard;
