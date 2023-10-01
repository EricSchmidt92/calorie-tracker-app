import DiaryList from '@/components/FoodDiary/DiaryList';
import FoodDiaryEntryModal from '@/components/FoodDiary/FoodDiaryEntryModal';
import FoodItemCard from '@/components/FoodDiary/FoodItemCard';
import { api } from '@/utils/api';
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Center,
	Group,
	Input,
	Menu,
	Modal,
	NumberInput,
	ScrollArea,
	SegmentedControl,
	Select,
	Stack,
	Text,
	TextInput,
	useMantineTheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDebouncedValue, useDisclosure, useInputState } from '@mantine/hooks';
import { FoodItem, MealCategoryType, UnitOfMeasurement } from '@prisma/client';
import { NextPage } from 'next';

import { useRouter } from 'next/router';
import { useState } from 'react';
import {
	CirclePlus,
	CircleX,
	Dots,
	Heart,
	History,
	List,
	Plus,
	Search,
	X,
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
		<Stack mah='100%' h='100%' style={{ flex: 2 }} gap={0}>
			<Box
				bg='neutral.6'
				p='sm'
				pos='sticky'
				top={0}
				style={{
					marginLeft: `-1em`,
					marginRight: '-1em',
					marginTop: '-1em',
					zIndex: 2,
				}}
			>
				<Group justify='apart' pb='xs'>
					<ActionIcon onClick={router.back}>
						<X />
					</ActionIcon>

					<Text m='0' fw='bold'>
						{category}
					</Text>

					<SubMenu />
				</Group>
				<Input
					radius='xl'
					variant='filled'
					leftSection={<Search size='1rem' />}
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
			{searchValue ? (
				<ScrollArea.Autosize mah='90%' style={{ flex: 2 }}>
					<Stack>
						<Box h={20}></Box>
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
						<Box h={70}></Box>
					</Stack>
				</ScrollArea.Autosize>
			) : (
				<>
					<FoodSummaryMainContent day={day} category={category} />
				</>
			)}

			<Box pos='sticky' bottom={0} left={20} right={20} bg='base.6' h={120}>
				<Button fullWidth onClick={router.back} h={50} tt='uppercase'>
					Done
				</Button>
			</Box>
		</Stack>
	);
};

export default EditDiaryPage;

const SubMenu = () => {
	const [opened, { open, close }] = useDisclosure(false);
	return (
		<>
			<Menu position='bottom-end' offset={2} transitionProps={{ transition: 'scale-y' }}>
				<Menu.Target>
					<ActionIcon size='md'>
						<Dots size='4rem' />
					</ActionIcon>
				</Menu.Target>

				<Menu.Dropdown bg='base.4'>
					<Menu.Item onClick={open}>
						<Group>
							<Text>Create food</Text>
							<Plus />
						</Group>
					</Menu.Item>
				</Menu.Dropdown>
			</Menu>

			<CreateFoodModal opened={opened} onClose={close} />
		</>
	);
};

interface CreateFoodModalProps {
	opened: boolean;
	onClose: () => void;
}

type ModalInitProps = Omit<FoodItem, 'id'>;

const CreateFoodModal = ({ opened, onClose }: CreateFoodModalProps) => {
	const form = useForm<ModalInitProps>({
		initialValues: {
			name: '',
			caloriesPerServing: 0,
			standardServingSize: 0,
			servingUnit: 'g',
		},
	});

	const { mutateAsync: createFoodItemMutation } = api.foodItem.create.useMutation();

	const selectVals: UnitOfMeasurement[] = ['g', 'mL'];

	const handleOnClose = () => {
		form.reset();
		onClose();
	};

	const createFoodItem = async (values: ModalInitProps) => {
		createFoodItemMutation(
			{
				...values,
			},
			{
				onError: error => console.error('something went wrong creating food item: ', error),
				onSuccess: item => {
					console.log('item successfully created!: ', item);
					handleOnClose();
				},
			}
		);
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
					<ActionIcon onClick={handleOnClose}>
						<X />
					</ActionIcon>

					<Modal.Title ta='center' style={{ flex: 2 }} fw='bold' pr='2rem'>
						Create Food
					</Modal.Title>
				</Modal.Header>

				<Modal.Body
					h='84%'
					display='flex'
					style={{ flexDirection: 'column', justifyContent: 'space-between' }}
				>
					<form onSubmit={form.onSubmit(createFoodItem)} style={{ height: '100%' }}>
						<Stack pt='lg' h='100%' w='100%' display='flex' justify='space-between'>
							<Stack>
								<TextInput
									required
									label='Food Name'
									placeholder='Chicken'
									{...form.getInputProps('name')}
								/>

								<NumberInput
									aria-label='Calories Per Serving'
									hideControls
									label='Calories Per Serving'
									{...form.getInputProps('caloriesPerServing')}
								/>

								<NumberInput
									required
									hideControls
									label='Standard Serving size'
									{...form.getInputProps('standardServingSize')}
								/>

								<Select
									required
									label='Serving Unit'
									placeholder={selectVals[0]}
									data={selectVals}
								/>
							</Stack>

							<Button tt='uppercase' type='submit' h={50}>
								Create Food
							</Button>
						</Stack>
					</form>
				</Modal.Body>
			</Modal.Content>
		</Modal.Root>
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
		<Box h='100%'>
			<Box
				h='3.85rem'
				top={94}
				left={0}
				right={0}
				pos='sticky'
				display='flex'
				style={{
					zIndex: 1,
					flexDirection: 'column',
					alignItems: 'stretch',
					justifyContent: 'flex-end',
				}}
				bg='base.6'
			>
				<SegmentedControl
					radius='xl'
					size='xs'
					value={subMenuSelection}
					onChange={setSubMenuSelection}
					fullWidth
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
			</Box>
			<>
				{subMenuSelection === 'recent' && <Text>recent view</Text>}
				{subMenuSelection === 'favorites' && <Text>favorites view</Text>}
				{subMenuSelection === 'list' && <DiaryList />}
			</>
		</Box>
	);
};
