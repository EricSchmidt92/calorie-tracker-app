import { api } from '@/utils/api';
import { useMantineTheme } from '@mantine/core';
import { $Enums, FoodItem } from '@prisma/client';
import { CirclePlus } from 'tabler-icons-react';

type AddDiaryEntryButtonProps = {
	item: FoodItem;
	category: $Enums.MealCategoryType;
	day: string;
};

const AddDiaryEntryButton = ({ item, category, day }: AddDiaryEntryButtonProps) => {
	const { mutateAsync: addDiaryEntryMutation } = api.foodDiary.addEntry.useMutation();
	const { colors } = useMantineTheme();
	const utils = api.useContext();

	const handleAddDiaryEntry = async (item: FoodItem, eatenServingSize: number = item.standardServingSize) => {
		await addDiaryEntryMutation(
			{ day, category, foodItemId: item.id, eatenServingSize },
			{
				onError: error => {
					console.error('error adding foodDiary entry: ', error);
				},
				onSuccess: () => {
					utils.foodDiary.getDiaryEntryCount.invalidate({ day, category });
				},
			}
		);
	};
	return (
		<CirclePlus
			strokeWidth={1}
			size={50}
			fill={colors.success[3]}
			color={colors.neutral[6]}
			onClick={e => {
				e.stopPropagation();
				handleAddDiaryEntry(item);
			}}
		/>
	);
};

export default AddDiaryEntryButton;
