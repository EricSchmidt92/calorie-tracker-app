import classes from '@/styles/diaryIndex.module.css';
import { calculateTotalCalories } from '@/utils/caloriesHelper';
import { Card, Group, Stack, Text } from '@mantine/core';
import { FoodItem } from '@prisma/client';
import { ReactNode, MouseEventHandler } from 'react';
import { Scale } from 'tabler-icons-react';

interface FoodItemCardProps {
	foodItem: FoodItem;
	icon: ReactNode;
	onClick?: MouseEventHandler<HTMLDivElement>;
	eatenServingSize?: number;
}

const FoodItemCard = ({ foodItem, icon, eatenServingSize, onClick }: FoodItemCardProps) => {
	const { name, caloriesPerServing, standardServingSize, servingUnit } = foodItem;

	const serving = eatenServingSize ? eatenServingSize : standardServingSize;
	const calories = eatenServingSize
		? calculateTotalCalories({ caloriesPerServing, eatenServingSize, standardServingSize })
		: caloriesPerServing;
	return (
		<>
			<Card p='sm' onClick={onClick}>
				<Group justify='space-between'>
					<Stack gap={0}>
						<Text className={classes.foodInfoCardText} truncate size='sm'>
							{name}
						</Text>
						<Text size='xs'>{calories} cal</Text>
						<Group gap={2}>
							<Scale size='0.9rem' />
							<Text size='xs'>
								{serving}
								{servingUnit}
							</Text>
						</Group>
					</Stack>

					{icon}
				</Group>
			</Card>
		</>
	);
};

export default FoodItemCard;
