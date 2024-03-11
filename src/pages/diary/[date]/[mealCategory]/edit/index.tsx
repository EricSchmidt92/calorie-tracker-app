import { FoodDiaryEntryModal, FoodItemCard } from '@/components/FoodDiary';
import DiaryList from '@/components/FoodDiary/DiaryList';
import BarcodeScannerModal from '@/components/editPage/BarcodeScannerModal';
import SubMenu from '@/components/editPage/SubMenu';

import { api } from '@/utils/api';
import { QuaggaJSResultObject } from '@ericblade/quagga2';
import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Center,
	Group,
	ScrollArea,
	SegmentedControl,
	Stack,
	Text,
	TextInput,
	useMantineTheme,
} from '@mantine/core';
import { useDebouncedValue, useDisclosure, useInputState } from '@mantine/hooks';
import { FoodItem, MealCategoryType } from '@prisma/client';
import { NextPage } from 'next';

import { useRouter } from 'next/router';
import { useState } from 'react';
import { Barcode, CirclePlus, CircleX, Heart, History, List, Search, X } from 'tabler-icons-react';

const EditDiaryPage: NextPage = () => {
	const router = useRouter();
	const [searchValue, setSearchValue] = useInputState('');
	const [debounced] = useDebouncedValue(searchValue, 200);
	const { colors } = useMantineTheme();
	const utils = api.useContext();
	const [opened, { open, close }] = useDisclosure(false);
	const [barcodeOpened, { open: barcodeOpen, close: barcodeClose }] = useDisclosure(false);
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

	const { mutateAsync: barcodeMutation } = api.foodItem.getOrCreateFoodItemByBarcode.useMutation();

	const { mutateAsync: addDiaryEntryMutation } = api.foodDiary.addEntry.useMutation();

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
					setSearchValue('');
					utils.foodDiary.getDiaryEntryCount.invalidate({ day, category });
				},
			}
		);
	};

	// rgba(75, 171, 209, 1)

	const handleModalClose = () => {
		setSelectedItem(undefined);
		setSearchValue('');
		close();
	};

	const handleBarcodeModalClose = () => {p
		barcodeClose();
	};

	const handleBarcodeDetected = async (barcode: string) => {
		handleBarcodeModalClose();

		await barcodeMutation({ barcode });
	};

	return (
		<Stack mah='100%' h='100%' style={{ flex: 2 }} gap={0}>
			<Box
				bg='neutral.6'
				p='sm'
				pos='sticky'
				top={0}
				style={{
					zIndex: 2,
				}}
			>
				<Group justify='space-between' pb='xs'>
					<ActionIcon aria-label='go back' onClick={router.back} variant='subtle'>
						<X />
					</ActionIcon>

					<Text m='0' fw='bold'>
						{category}
					</Text>

					<SubMenu />
				</Group>
				<TextInput
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
						) : (
							<Barcode
								strokeWidth={1}
								fill={colors.dark[0]}
								color={colors.dark[0]}
								onClick={barcodeOpen}
							/>
						)
					}
					value={searchValue}
					onChange={setSearchValue}
				/>
				<BarcodeScannerModal
					opened={barcodeOpened}
					onClose={handleBarcodeModalClose}
					onDetected={handleBarcodeDetected}
				/>
			</Box>
			{searchValue ? (
				<ScrollArea.Autosize mah='90%' style={{ flex: 2 }} type='never'>
					<Stack>
						<Box h={20}></Box>
						{error && <Text c='error.4'>Error fetching food items</Text>}

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
