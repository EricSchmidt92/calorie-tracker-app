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

						<FoodDiaryEntryModal
							opened={opened}
							onClose={close}
							foodItem={selectedItem}
							handleSubmission={item => {
								console.log('you want to submit a new food diary entry with item of: ', item);
								close();
							}}
						/>
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
}

const FoodItemCard = ({ foodItem, icon, onClick }: FoodItemCardProps) => {
	const { name, caloriesPerServing, standardServingSize, servingUnit } = foodItem;
	const { classes } = useStyles();

	return (
		<>
			<Card p='sm' onClick={onClick}>
				<Group position='apart'>
					<Stack spacing={0}>
						<Text className={classes.foodInfoCardText} truncate size='sm'>
							{name}
						</Text>
						<Text size='xs'>{caloriesPerServing} cal</Text>
						<Group spacing={2}>
							<Scale size='0.9rem' />
							<Text size='xs'>
								{standardServingSize}
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

const DiaryList = () => {
	const router = useRouter();
	const category = router.query.mealCategory as MealCategoryType;
	const day = router.query.date as string;
	const { colors } = useMantineTheme();
	const utils = api.useContext();
	const [opened, { open, close }] = useDisclosure();
	const [selectedItem, setSelectedItem] = useState<FoodItem | undefined>(undefined);

	const { data, error, isLoading } = api.foodDiary.getEntriesByDayAndCategory.useQuery({
		day,
		category,
	});

	const { mutateAsync: deleteDiaryEntryMutation } = api.foodDiary.removeEntry.useMutation();

	const handleCardClick = (item: FoodItem) => {
		setSelectedItem(item);
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

	return (
		<Stack>
			<Text>Diary List is here and the path is: {router.pathname}</Text>

			{data.map(({ id, foodItem }) => (
				<Fragment key={id}>
					<FoodItemCard
						foodItem={foodItem}
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
						onClick={() => handleCardClick(foodItem)}
					/>
				</Fragment>
			))}
			<FoodDiaryEntryModal
				opened={opened}
				onClose={close}
				foodItem={selectedItem}
				handleSubmission={item => {
					console.log('EDIT FOOD ITEM modal submission done with item of: ', item);
					close();
				}}
			/>
		</Stack>
	);
};

interface FoodDiaryEntryModalProps {
	opened: boolean;
	onClose: () => void;
	foodItem?: FoodItem;
	handleSubmission: (value: { foodItem: FoodItem; eatenServingSize: number }) => void;
}

const FoodDiaryEntryModal = ({
	opened,
	onClose,
	foodItem,
	handleSubmission,
}: FoodDiaryEntryModalProps) => {
	if (!foodItem) return null;

	const { name, standardServingSize, servingUnit, caloriesPerServing } = foodItem;
	const form = useForm({
		initialValues: {
			eatenServingSize: standardServingSize,
		},

		validate: {
			eatenServingSize: value => (value <= 0 ? 'Must have a serving size' : null),
		},
	});

	const handleSubmitClick = ({ eatenServingSize }: typeof form.values) => {
		handleSubmission({ foodItem, eatenServingSize });
	};

	const totalCalories = calculateTotalCalories({
		standardServingSize,
		eatenServingSize: form.values.eatenServingSize,
		caloriesPerServing,
	});

	return (
		<Modal.Root
			opened={opened}
			onClose={() => {
				console.log('closing modal now');
				onClose();
			}}
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
							<ActionIcon onClick={onClose}>
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
							<Stack>
								<Group position='center'>
									<NumberInput
										{...form.getInputProps('servingSize')}
										w={50}
										hideControls
										aria-label='Serving Size'
									/>{' '}
									<Text>{servingUnit}(s)</Text>
								</Group>
								<Text>{totalCalories} calories</Text>
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
