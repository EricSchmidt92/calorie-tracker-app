import { api } from '@/utils/api';
import {
	ActionIcon,
	Alert,
	Box,
	Button,
	Card,
	Center,
	Group,
	Input,
	ScrollArea,
	SegmentedControl,
	Stack,
	Text,
	createStyles,
	em,
	useMantineTheme,
} from '@mantine/core';
import { useDebouncedValue, useInputState } from '@mantine/hooks';
import { FoodItem, MealCategoryType } from '@prisma/client';
import { NextPage } from 'next';

import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import {
	AlertCircle,
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
	const type = router.query.mealCategory as string;
	const [searchValue, setSearchValue] = useInputState('');
	const [debounced] = useDebouncedValue(searchValue, 200);
	const { colors } = useMantineTheme();
	const day = router.query.date as string;
	const mealCategory = router.query.mealCategory as MealCategoryType;

	const { data, error } = api.foodItem.getFoodItemsByName.useQuery(
		{ name: debounced },
		{
			enabled: debounced.length > 0,
		}
	);

	const { mutateAsync } = api.foodDiary.addEntry.useMutation();

	const handleAddDiaryEntry = async (
		item: FoodItem,
		servingQuantity: number = item.servingSize
	) => {
		await mutateAsync(
			{ day, category: mealCategory, foodItemId: item.id, servingQuantity },
			{
				onError: error => {
					console.error('error adding foodDiary entry: ', error);
				},
				onSuccess: input => {
					console.log('successfully added with input: ', input);
					setSearchValue('');
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
						{type}
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
								onClick={() => setSearchValue('')}
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

						{data &&
							data?.map(item => (
								<FoodItemCard
									key={item.id}
									foodItem={item}
									icon={
										<CirclePlus
											onClick={() => handleAddDiaryEntry(item)}
											strokeWidth={1}
											size={50}
											fill={colors.success[3]}
											color={colors.neutral[6]}
										/>
									}
								/>
							))}
					</Stack>
				) : (
					<FoodSummaryMainContent />
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
}

const FoodItemCard = ({ foodItem, icon }: FoodItemCardProps) => {
	const { name, caloriesPerServing, servingSize, servingUnit } = foodItem;
	const { classes } = useStyles();
	return (
		<Card p='sm'>
			<Group position='apart'>
				<Stack spacing={0}>
					<Text className={classes.foodInfoCardText} truncate size='sm'>
						{name}
					</Text>
					<Text size='xs'>{caloriesPerServing} cal</Text>
					<Group spacing={2}>
						<Scale size='0.9rem' />
						<Text size='xs'>
							{servingSize}
							{servingUnit}
						</Text>
					</Group>
				</Stack>

				{icon}
			</Group>
		</Card>
	);
};

const FoodSummaryMainContent = () => {
	const [subMenuSelection, setSubMenuSelection] = useInputState('favorites');
	const { colors } = useMantineTheme();

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
								<List color={subMenuSelection === 'list' ? colors.success[3] : undefined} />
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

	const { data, error, isLoading } = api.foodDiary.getEntriesByDayAndCategory.useQuery({
		day,
		category,
	});

	const { mutateAsync: deleteDiaryEntryMutation } = api.foodDiary.removeEntry.useMutation();

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
				},
			}
		);
	};

	return (
		<Stack>
			<Text>Diary List is here and the path is: {router.pathname}</Text>

			{data.map(({ id, foodItem }) => (
				<FoodItemCard
					foodItem={foodItem}
					key={id}
					icon={
						<CircleX
							onClick={() => handleDeleteDiaryEntry(id)}
							strokeWidth={1}
							size={50}
							fill={colors.error[4]}
							color={colors.neutral[6]}
						/>
					}
				/>
			))}
		</Stack>
	);
};
