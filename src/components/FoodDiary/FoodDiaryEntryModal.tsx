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
	const { name, standardServingSize, servingUnit, caloriesPerServing } = foodItem;
	const initialServingSize = initialServingSizeVal ?? standardServingSize;
	const form = useForm({
		initialValues: {
			eatenServingSize: initialServingSize,
		},

		validate: {
			eatenServingSize: value => (value <= 0 ? 'Must have a serving size' : null),
		},
	});
	const router = useRouter();

	if (!foodItem) return null;
	if (submissionType === 'edit' && !diaryId) {
		throw new Error('You must submit a diary edit id with a submission type of edit');
	}

	const day = router.query.date as string;
	const category = router.query.mealCategory as MealCategoryType;
	const { mutateAsync: addDiaryEntryMutation } = api.foodDiary.addEntry.useMutation();
	const { mutateAsync: editDiaryEntryMutation } = api.foodDiary.editEntry.useMutation();
	const utils = api.useContext();

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
			style={() => ({
				body: {
					height: '90%',
				},
			})}
		>
			<Modal.Overlay />

			<Modal.Content>
				<Modal.Header style={{ justifyContent: 'space-between' }}>
					<Group justify='space-between' w='100%'>
						<ActionIcon onClick={handleOnClose} aria-label='go back'>
							<ChevronLeft />
						</ActionIcon>

						<Modal.Title>
							<Text m='0' fw='bold' maw={200}>
								{name}
							</Text>
						</Modal.Title>

						<ActionIcon size='sm' aria-label='favorite item'>
							<Heart />
						</ActionIcon>
					</Group>
				</Modal.Header>

				<Modal.Body
					h='84%'
					display='flex'
					style={{ flexDirection: 'column', justifyContent: 'space-between' }}
				>
					<form onSubmit={form.onSubmit(handleSubmitClick)}>
						<ScrollArea.Autosize mah='100%' type='never'>
							<Box h={20}></Box>
							<Stack gap='xl'>
								<Group justify='center'>
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
								<Group gap='xs' justify='center'>
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
