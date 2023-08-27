import { api } from '@/utils/api';
import {
	Button,
	Card,
	Divider,
	Group,
	ScrollArea,
	Stack,
	Text,
	useMantineTheme,
} from '@mantine/core';
import { MealCategoryType } from '@prisma/client';
import { DateTime } from 'luxon';
import { signIn, signOut, useSession } from 'next-auth/react';
import Head from 'next/head';
import * as Icons from 'tabler-icons-react';
import { NextPageWithLayout } from './_app';
import styles from './index.module.css';
import { DailySummary, MealCategorySummary } from '@/server/api/routers/foodEntries';

type IconName = keyof typeof Icons;

const Home: NextPageWithLayout = () => {
	const { data: session } = useSession();

	return (
		<>
			<Head>
				<title>Calorie Tracker</title>
				<meta name='description' content='For helping your diet stay on track' />
				<link rel='icon' href='/favicon.ico' />
				<meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width' />
			</Head>
			{!session?.user ? (
				<Button onClick={() => void signIn()}>Login to use app</Button>
			) : (
				<HomeAuthenticated />
			)}
		</>
	);
};

const HomeAuthenticated = () => {
	const { data: dailySummary, error } = api.foodEntries.getDailyCalorieSummary.useQuery({
		day: DateTime.now().toISODate() ?? '',
	});

	const { breakpoints } = useMantineTheme();

	if (error) {
		console.error('error getting data: ', error);
	}

	console.log(dailySummary);

	return (
		<>
			<Head>
				<title>Calorie Tracker</title>
				<meta name='description' content='For helping your diet stay on track' />
				<link rel='icon' href='/favicon.ico' />
				<meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width' />
			</Head>
			{/* <AuthShowcase /> */}
			<ScrollArea>
				<Stack maw={breakpoints.xs} justify='center' mx='auto'>
					{dailySummary?.mealCategorySummaries?.map(dailySummary => (
						<MealSummaryCard key={dailySummary.id} summary={dailySummary} />
					))}
				</Stack>
			</ScrollArea>
		</>
	);
};

interface MealSummaryCardProps {
	summary: MealCategorySummary;
}

const MealSummaryCard = ({ summary }: MealSummaryCardProps) => {
	const IconMap: Record<MealCategoryType, IconName> = {
		Breakfast: 'Egg', // Maybe Egg or EggFried?? or coffee
		Lunch: 'Salad', // or cheese?
		Dinner: 'Soup', // Sausage? Soup? Fish?
		Snack: 'Cookie', // or ice cream?
	};

	const { name, calorieCount, foodItems } = summary;

	const iconName = IconMap[name];
	const Icon = Icons[iconName];

	const { colors } = useMantineTheme();
	console.log('calories: ', calorieCount);

	return (
		<Card>
			<Stack spacing='xs'>
				<Group position='apart'>
					<Group sx={{ flex: 2 }}>
						<Icon size={35} />
						<Stack spacing={0}>
							<Text fw='bold'>{name}</Text>
							<Text w={200} truncate size='xs'>
								{foodItems.join(', ')}
							</Text>
						</Stack>
					</Group>
					<Icons.CirclePlus
						strokeWidth={1}
						size={50}
						fill={colors.success[3]}
						// fill={colors.purple[3]}
						// fill={colors.primaryPink[3]}
						// fill={colors.success[4]}
						// fill={colors.base[6]}
						color={colors.neutral[6]}
					/>
				</Group>
				{calorieCount > 0 && (
					<>
						<Divider color={colors.neutral[4]} />
						<Text fw='bold' align='center' size='sm'>
							{calorieCount} calories
						</Text>
					</>
				)}
			</Stack>
		</Card>
	);
};

function AuthShowcase() {
	return (
		<div className={styles.authContainer}>
			<Button onClick={() => void signOut()}>Sign out</Button>
		</div>
	);
}

export default Home;
