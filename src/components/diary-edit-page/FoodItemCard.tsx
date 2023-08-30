import { Card, Group, Stack, Text, createStyles, em, useMantineTheme } from '@mantine/core';
import { FoodItem } from '@prisma/client';
import { CirclePlus } from 'tabler-icons-react';

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

const FoodItemCard = ({ foodItem }: { foodItem: FoodItem }) => {
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

				<CirclePlus
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

export default FoodItemCard;
