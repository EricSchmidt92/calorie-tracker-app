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
	ScrollArea,
	SegmentedControl,
	Stack,
	Text,
	useMantineTheme,
} from '@mantine/core';
import { useDebouncedValue, useDisclosure, useInputState } from '@mantine/hooks';
import { FoodItem, MealCategoryType } from '@prisma/client';
import { NextPage } from 'next';

import { useRouter } from 'next/router';
import { useState } from 'react';
import { CirclePlus, CircleX, Dots, Heart, History, List, Search } from 'tabler-icons-react';

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
		<Stack mah='100%' h='100%' sx={{ flex: 2 }} spacing={0}>
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
			{searchValue ? (
				<ScrollArea.Autosize mah='90%' sx={{ flex: 2 }}>
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
				sx={{
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
