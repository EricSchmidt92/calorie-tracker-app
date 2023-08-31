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
import { AlertCircle, CirclePlus, Dots, Heart, History, List, Search } from 'tabler-icons-react';

const EditDiaryPage: NextPage = () => {
	const router = useRouter();
	const type = router.query.mealCategory as string;
	const [searchValue, setSearchValue] = useInputState('');
	const [debounced] = useDebouncedValue(searchValue, 200);

	const { data, error } = api.foodItem.getFoodItemsByName.useQuery(
		{ name: debounced },
		{
			enabled: debounced.length > 0,
		}
	);

	return (
		<Stack h='100%' id='STACK-ID-HELP'>
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
					value={searchValue}
					onChange={setSearchValue}
				/>
			</Box>
			<ScrollArea.Autosize mah='100%' sx={{ flex: 2 }}>
				<Box h={20}></Box>
				{searchValue ? (
					<Stack>
						{error && <Text color='error.4'>Error fetching food items</Text>}

						{data && data?.map(item => <FoodItemCard key={item.id} foodItem={item} />)}
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

const FoodItemCard = ({ foodItem }: { foodItem: FoodItem }) => {
	const { name, caloriesPerServing, servingSize, servingUnit } = foodItem;
	const { colors } = useMantineTheme();
	const { classes } = useStyles();
	return (
		<Card p='sm'>
			<Group position='apart'>
				<Stack spacing={0}>
					<Text className={classes.foodInfoCardText} truncate size='sm'>
						{name}
					</Text>
					<Text size='xs'>{caloriesPerServing} cal</Text>
					<Text size='xs'>
						{servingSize}
						{servingUnit}
					</Text>
				</Stack>

				<CirclePlus
					onClick={() => console.log('you want to add this to your meal category')}
					strokeWidth={1}
					size={50}
					fill={colors.success[3]}
					color={colors.neutral[6]}
				/>
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

	const { data, error, isLoading } = api.foodDiary.getEntriesByDayAndCategory.useQuery({
		day,
		category,
	});

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

	return (
		<Stack>
			<Text>Diary List is here and the path is: {router.pathname}</Text>

			{data.map(({ id, servingQuantity, foodItem }) => (
				<Card key={id}>
					<Text>
						{foodItem.name} -- {servingQuantity}
						{foodItem.servingUnit}
					</Text>
				</Card>
			))}
		</Stack>
	);
};
