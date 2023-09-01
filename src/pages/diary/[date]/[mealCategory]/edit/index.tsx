import { api } from '@/utils/api';
import { calculateTotalCalories } from '@/utils/caloriesHelper';
import {
	ActionIcon,
	Alert,
	Badge,
	Box,
	Button,
	Card,
	Center,
	Group,
	Input,
	Modal,
	NumberInput,
	ScrollArea,
	SegmentedControl,
	Stack,
	Text,
	createStyles,
	em,
	useMantineTheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedValue, useDisclosure, useInputState } from '@mantine/hooks';
import { FoodItem, MealCategoryType } from '@prisma/client';
import { NextPage } from 'next';

import { useRouter } from 'next/router';
import { Fragment, MouseEventHandler, ReactNode, useState } from 'react';
import {
	AlertCircle,
	ChevronLeft,
	CirclePlus,
	CircleX,
	Dots,
	Heart,
	History,
	List,
	Scale,
	Search,
} from 'tabler-icons-react';

const EditDiaryPage: NextPage = () => {
	const router = useRouter();
	const [searchValue, setSearchValue] = useInputState('');
	const [debounced] = useDebouncedValue(searchValue, 200);
	const { colors } = useMantineTheme();
	const utils = api.useContext();
	const [opened, { open, close }] = useDisclosure(false);
	const [selectedItem, setSelectedItem] = useState<FoodItem | undefined>(undefined);

	const day = router.query.date as string;
	const category = router.query.mealCategory as MealCategoryType;

	const { data: searchResults, error } = api.foodItem.getFoodItemsByName.useQuery(
		{ name: debounced },
		{
			enabled: debounced.length > 0,
		}
	);

	const handleCardClick = (item: FoodItem) => {
		setSelectedItem(item);
		open();
	};

	const { mutateAsync } = api.foodDiary.addEntry.useMutation();

	const handleAddDiaryEntry = async (
		item: FoodItem,
		eatenServingSize: number = item.standardServingSize
	) => {
		await mutateAsync(
			{ day, category, foodItemId: item.id, eatenServingSize },
			{
				onError: error => {
					console.error('error adding foodDiary entry: ', error);
				},
				onSuccess: () => {
					setSearchValue('');
					utils.foodDiary.getDiaryEntryCount.invalidate({ day, category });
				},
			}
		);
	};

	const handleModalClose = () => {
		setSelectedItem(undefined);
		setSearchValue('');
		close();
	};

	return (
		<Stack h='100%'>
			<Box
				bg='neutral.6'
				p='sm'
				pos='sticky'
				top={0}
				sx={{
					marginLeft: `-1em`,
					marginRight: '-1em',
					marginTop: '-1em',
					zIndex: 2,
				}}
			>
				<Group position='apart'>
					<Button variant='subtle' color='dark.0' onClick={router.back}>
						X
					</Button>

					<Text m='0' fw='bold'>
						{category}
					</Text>

					<ActionIcon size='sm'>
						<Dots />
					</ActionIcon>
				</Group>
				<Input
					radius='xl'
					variant='filled'
					icon={<Search size='1rem' />}
					rightSection={
						searchValue ? (
							<CircleX
								strokeWidth={1}
								fill={colors.neutral[6]}
								color={colors.base[6]}
								onClick={e => {
									e.stopPropagation();
									setSearchValue('');
								}}
							/>
						) : undefined
					}
					value={searchValue}
					onChange={setSearchValue}
				/>
			</Box>
			<ScrollArea.Autosize mah='100%' sx={{ flex: 2 }}>
				<Box h={20}></Box>
				{searchValue ? (
					<Stack>
						{error && <Text color='error.4'>Error fetching food items</Text>}

						{searchResults &&
							searchResults?.map(item => (
								<FoodItemCard
									key={item.id}
									foodItem={item}
									icon={
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
									}
									onClick={() => handleCardClick(item)}
								/>
							))}

						{selectedItem && (
							<FoodDiaryEntryModal
								opened={opened}
								onClose={handleModalClose}
								foodItem={selectedItem}
								submissionType='create'
							/>
						)}
					</Stack>
				) : (
					<FoodSummaryMainContent day={day} category={category} />
				)}
				<Box h={70}></Box>
			</ScrollArea.Autosize>

			<Box pos='sticky' bottom={0} left={20} right={20} bg='base.6' h={100}>
				<Button fullWidth onClick={router.back} h={50} tt='uppercase'>
					Done
				</Button>
			</Box>
		</Stack>
	);
};

export default EditDiaryPage;

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

interface FoodItemCardProps {
	foodItem: FoodItem;
	icon: ReactNode;
	onClick?: MouseEventHandler<HTMLDivElement>;
	eatenServingSize?: number;
}

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

const FoodSummaryMainContent = ({ day, category }: { day: string; category: MealCategoryType }) => {
	const [subMenuSelection, setSubMenuSelection] = useInputState('favorites');
	const { colors } = useMantineTheme();
	const { data: entryCount } = api.foodDiary.getDiaryEntryCount.useQuery({
		day,
		category: category,
	});

	return (
		<Stack>
			<SegmentedControl
				radius='xl'
				size='xs'
				value={subMenuSelection}
				onChange={setSubMenuSelection}
				data={[
					{
						value: 'recent',
						label: (
							<Center>
								<History color={subMenuSelection === 'recent' ? colors.success[3] : undefined} />
							</Center>
						),
					},
					{
						value: 'favorites',
						label: (
							<Center>
								<Heart color={subMenuSelection === 'favorites' ? colors.success[3] : undefined} />
							</Center>
						),
					},
					{
						value: 'list',
						label: (
							<Center>
								<Box pos='relative'>
									{!!entryCount && (
										<Badge
											variant='filled'
											color='success.7'
											size='xs'
											pos='absolute'
											bottom={0}
											right={-10}
										>
											{entryCount}
										</Badge>
									)}
									<List color={subMenuSelection === 'list' ? colors.success[3] : undefined} />
								</Box>
							</Center>
						),
					},
				]}
			/>
			{subMenuSelection === 'recent' && <Text>recent view</Text>}
			{subMenuSelection === 'favorites' && <Text>favorites view</Text>}
			{subMenuSelection === 'list' && <DiaryList />}
		</Stack>
	);
};

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
		<Stack>
			<Text>Diary List is here and the path is: {router.pathname}</Text>

			{diaryEntries.map(({ id, foodItem, eatenServingSize }) => (
				<Fragment key={id}>
					<FoodItemCard
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
				</Fragment>
			))}
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
		</Stack>
	);
};

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
										w={50}
										hideControls
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
