import { api } from '@/utils/api';
import { Alert, Box, ScrollArea, Stack, Text, useMantineTheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { FoodItem, MealCategoryType } from '@prisma/client';
import { useRouter } from 'next/router';
import { Fragment, useState } from 'react';
import { AlertCircle, CircleX } from 'tabler-icons-react';
import FoodItemCard from './FoodItemCard';
import FoodDiaryEntryModal from './FoodDiaryEntryModal';

interface DiaryEntryProps {
	foodItem: FoodItem;
	eatenServingSize: number;
	diaryId: string;
}

const DiaryList = () => {
	const router = useRouter();
	const category = router.query.mealCategory as MealCategoryType;
	const day = router.query.date as string;
	const { colors } = useMantineTheme();
	const utils = api.useContext();
	const [opened, { open, close }] = useDisclosure();
	const [selectedItem, setSelectedItem] = useState<DiaryEntryProps | undefined>(undefined);

	const {
		data: diaryEntries,
		error,
		isLoading,
	} = api.foodDiary.getEntriesByDayAndCategory.useQuery({
		day,
		category,
	});

	const { mutateAsync: deleteDiaryEntryMutation } = api.foodDiary.removeEntry.useMutation();

	const handleCardClick = ({ foodItem, eatenServingSize, diaryId }: DiaryEntryProps) => {
		setSelectedItem({ foodItem, eatenServingSize, diaryId });
		open();
	};

	if (isLoading) {
		return <Text>Loading....</Text>;
	}

	if (error) {
		return (
			<Alert icon={<AlertCircle />} title='Uh oh!' color='error.4'>
				Something went wrong loading your food diary entries. Please try again!
			</Alert>
		);
	}

	const handleDeleteDiaryEntry = async (id: string) => {
		await deleteDiaryEntryMutation(
			{ id },
			{
				onError: error => console.error('Error deleting entry: ', error),
				onSuccess: () => {
					utils.foodDiary.getEntriesByDayAndCategory.invalidate({ day, category });
					utils.foodDiary.getDiaryEntryCount.invalidate({ day, category });
				},
			}
		);
	};

	const handleModalClose = () => {
		setSelectedItem(undefined);
		close();
	};

	return (
		<Box>
			<ScrollArea.Autosize mah='70%' pt='lg'>
				<Stack py='md'>
					{diaryEntries.map(({ id, foodItem, eatenServingSize }) => (
						<FoodItemCard
							key={id}
							foodItem={foodItem}
							eatenServingSize={eatenServingSize}
							icon={
								<CircleX
									onClick={e => {
										e.stopPropagation();
										handleDeleteDiaryEntry(id);
									}}
									strokeWidth={1}
									size={50}
									fill={colors.error[4]}
									color={colors.neutral[6]}
								/>
							}
							onClick={() => handleCardClick({ foodItem, eatenServingSize, diaryId: id })}
						/>
					))}
				</Stack>
				<Box h={60}></Box>
			</ScrollArea.Autosize>

			{selectedItem && (
				<FoodDiaryEntryModal
					opened={opened}
					onClose={handleModalClose}
					foodItem={selectedItem.foodItem}
					initialServingSizeVal={selectedItem.eatenServingSize}
					diaryId={selectedItem.diaryId}
					submissionType='edit'
				/>
			)}
		</Box>
	);
};

export default DiaryList;
