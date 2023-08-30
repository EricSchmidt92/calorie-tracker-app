import { api } from '@/utils/api';
import {
	ActionIcon,
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
import { FoodItem } from '@prisma/client';
import { NextPage } from 'next';

import { useRouter } from 'next/router';
import { CirclePlus, Dots, Heart, History, List, Search } from 'tabler-icons-react';

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
		<Stack>
			<Box
				bg='neutral.6'
				sx={{ marginLeft: `-1em`, marginRight: '-1em', marginTop: '-1em' }}
				p='sm'
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
			<ScrollArea.Autosize mah='100%'>
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

			<Button pos='absolute' bottom={0} left={0} right={0} onClick={router.back}>
				Done
			</Button>
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

	return <Text>Diary List is here and the path is: {router.pathname}</Text>;
};
