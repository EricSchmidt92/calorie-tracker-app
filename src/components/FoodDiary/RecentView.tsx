import { api } from '@/utils/api';
import { Alert, Center, Loader, Stack } from '@mantine/core';
import { $Enums } from '@prisma/client';
import AddDiaryEntryButton from './FoodItemCard/AddDiaryEntryButton';
import FoodItemCard from './FoodItemCard/FoodItemCard';

type Props = {
	category: $Enums.MealCategoryType;
	day: string;
};

const RecentView = ({ category, day }: Props) => {
	const { data, isError, isLoading } = api.foodDiary.getRecentEntries.useQuery({ category });
	if (isError || !data) {
		return (
			<Alert title='Error' color='red' variant='filled'>
				There was an error fetching recent entries.
			</Alert>
		);
	}

	if (isLoading) {
		return (
			<Center>
				<Loader />
			</Center>
		);
	}

	return (
		<Stack py='md'>
			{data.map(item => (
				<FoodItemCard
					key={item.id}
					foodItem={item.foodItem}
					icon={<AddDiaryEntryButton category={category} day={day} item={item.foodItem} />}
				/>
			))}
		</Stack>
	);
};

export default RecentView;
