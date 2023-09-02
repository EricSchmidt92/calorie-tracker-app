import { calculateTotalCalories } from '@/utils/caloriesHelper';
import { Card, Group, Stack, Text, createStyles, em } from '@mantine/core';
import { FoodItem } from '@prisma/client';
import { ReactNode, MouseEventHandler } from 'react';
import { Scale } from 'tabler-icons-react';

interface FoodItemCardProps {
	foodItem: FoodItem;
	icon: ReactNode;
	onClick?: MouseEventHandler<HTMLDivElement>;
	eatenServingSize?: number;
}

const useStyles = createStyles(() => ({
	foodInfoCardText: {
		[`@media (max-width: ${em(370)})`]: {
			width: '180px',
		},

		[`@media (min-width: ${em(371)}) and (max-width: ${em(450)})`]: {
			width: '180px',
		},
	},
}));

const FoodItemCard = ({ foodItem, icon, eatenServingSize, onClick }: FoodItemCardProps) => {
	const { name, caloriesPerServing, standardServingSize, servingUnit } = foodItem;
	const { classes } = useStyles();

	const serving = eatenServingSize ? eatenServingSize : standardServingSize;
	const calories = eatenServingSize
		? calculateTotalCalories({ caloriesPerServing, eatenServingSize, standardServingSize })
		: caloriesPerServing;
	return (
		<>
			<Card p='sm' onClick={onClick}>
				<Group position='apart'>
					<Stack spacing={0}>
						<Text className={classes.foodInfoCardText} truncate size='sm'>
							{name}
						</Text>
						<Text size='xs'>{calories} cal</Text>
						<Group spacing={2}>
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
