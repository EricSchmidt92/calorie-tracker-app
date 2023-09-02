import { api } from '@/utils/api';
import { calculateTotalCalories } from '@/utils/caloriesHelper';
import {
	ActionIcon,
	Box,
	Button,
	Group,
	Modal,
	NumberInput,
	ScrollArea,
	Stack,
	Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { FoodItem, MealCategoryType } from '@prisma/client';
import { useRouter } from 'next/router';
import { ChevronLeft, Heart } from 'tabler-icons-react';

interface FoodDiaryEntryModalProps {
	opened: boolean;
	onClose: () => void;
	foodItem: FoodItem;
	initialServingSizeVal?: number;
	submissionType: 'edit' | 'create';
	diaryId?: string;
}

const FoodDiaryEntryModal = ({
	opened,
	onClose,
	foodItem,
	initialServingSizeVal,
	submissionType,
	diaryId,
}: FoodDiaryEntryModalProps) => {
	if (!foodItem) return null;
	if (submissionType === 'edit' && !diaryId) {
		throw new Error('You must submit a diary edit id with a submission type of edit');
	}

	const { name, standardServingSize, servingUnit, caloriesPerServing } = foodItem;
	const initialServingSize = initialServingSizeVal ?? standardServingSize;
	const router = useRouter();
	const day = router.query.date as string;
	const category = router.query.mealCategory as MealCategoryType;
	const { mutateAsync: addDiaryEntryMutation } = api.foodDiary.addEntry.useMutation();
	const { mutateAsync: editDiaryEntryMutation } = api.foodDiary.editEntry.useMutation();
	const utils = api.useContext();

	const form = useForm({
		initialValues: {
			eatenServingSize: initialServingSize,
		},

		validate: {
			eatenServingSize: value => (value <= 0 ? 'Must have a serving size' : null),
		},
	});

	const handleEditDiaryEntry = async (eatenServingSize: number) => {
		if (!diaryId) return onClose();

		await editDiaryEntryMutation(
			{
				diaryId,
				eatenServingSize,
			},
			{
				onError: error => console.error('error editing food diary entry: ', error),
				onSuccess: input => {
					utils.foodDiary.getEntriesByDayAndCategory.invalidate({ day, category });
				},
			}
		);
	};

	const handleAddDiaryEntry = async (
		item: FoodItem,
		eatenServingSize: number = item.standardServingSize
	) => {
		await addDiaryEntryMutation(
			{ day, category, foodItemId: item.id, eatenServingSize },
			{
				onError: error => {
					console.error('error adding foodDiary entry: ', error);
				},
				onSuccess: () => {
					utils.foodDiary.getDiaryEntryCount.invalidate({ day, category });
					utils.foodDiary.getEntriesByDayAndCategory.invalidate({ day, category });
				},
			}
		);
	};

	const handleSubmitClick = async ({ eatenServingSize }: typeof form.values) => {
		if (submissionType === 'edit') {
			await handleEditDiaryEntry(eatenServingSize);
		}

		if (submissionType === 'create') {
			await handleAddDiaryEntry(foodItem, eatenServingSize);
		}

		handleOnClose();
	};

	const totalCalories = calculateTotalCalories({
		standardServingSize,
		eatenServingSize: form.values.eatenServingSize,
		caloriesPerServing,
	});

	const handleOnClose = () => {
		form.reset();
		onClose();
	};

	return (
		<Modal.Root
			opened={opened}
			onClose={handleOnClose}
			transitionProps={{ transition: 'slide-up', duration: 300 }}
			fullScreen
			styles={() => ({
				body: {
					height: '90%',
				},
			})}
		>
			<Modal.Overlay />

			<Modal.Content>
				<Modal.Header sx={{ justifyContent: 'space-between' }}>
					<Stack w='100%' pb='xs'>
						<Group position='apart'>
							<ActionIcon onClick={handleOnClose}>
								<ChevronLeft />
							</ActionIcon>

							<Modal.Title>
								<Text m='0' fw='bold' maw={200}>
									{name}
								</Text>
							</Modal.Title>

							<ActionIcon size='sm'>
								<Heart />
							</ActionIcon>
						</Group>
					</Stack>
				</Modal.Header>

				<Modal.Body
					h='84%'
					display='flex'
					sx={{ flexDirection: 'column', justifyContent: 'space-between' }}
				>
					<form onSubmit={form.onSubmit(handleSubmitClick)}>
						<ScrollArea.Autosize mah='100%'>
							<Box h={20}></Box>
							<Stack spacing='xl'>
								<Group position='center'>
									<NumberInput
										hideControls
										data-autofocus
										w={50}
										aria-label='Serving Size'
										{...form.getInputProps('eatenServingSize')}
									/>{' '}
									<Text>{servingUnit}(s)</Text>
								</Group>
								<Text ta='center'>
									Standard serving size: {standardServingSize}
									{servingUnit}
								</Text>
								<Group spacing='xs' position='center'>
									<Text size='xl'>{totalCalories}</Text>
									<Text>calories</Text>
								</Group>
							</Stack>
							<Box h={70}></Box>
						</ScrollArea.Autosize>

						<Box pos='absolute' bottom={0} left={20} right={20} bg='base.6' h={100}>
							<Button fullWidth type='submit' h={50} tt='uppercase'>
								Track
							</Button>
						</Box>
					</form>
				</Modal.Body>
			</Modal.Content>
		</Modal.Root>
	);
};

export default FoodDiaryEntryModal;
