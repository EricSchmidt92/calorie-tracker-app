import { api } from '@/utils/api';
import { Button, Card, Group, ScrollArea, Stack, Text, useMantineTheme } from '@mantine/core';
import { MealCategoryType } from '@prisma/client';
import { DateTime } from 'luxon';
import { signIn, signOut, useSession } from 'next-auth/react';
import Head from 'next/head';
import * as Icons from 'tabler-icons-react';
import { NextPageWithLayout } from './_app';
import styles from './index.module.css';

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
	const { data: dailySummaries, error } = api.foodEntries.getDailyCalorieSummary.useQuery({
		day: DateTime.now().toISODate() ?? '',
	});

	const { breakpoints } = useMantineTheme();

	if (error) {
		console.error('error getting data: ', error);
	}

	console.log(dailySummaries);

	return (
		<>
			<Head>
				<title>Calorie Tracker</title>
				<meta name='description' content='For helping your diet stay on track' />
				<link rel='icon' href='/favicon.ico' />
				<meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width' />
			</Head>
			<AuthShowcase />
			<ScrollArea>
				<Stack maw={breakpoints.xs} justify='center' mx='auto'>
					{/* <MealSummaryCard title='Breakfast' calories={150} iconName='Bread' /> */}
					{dailySummaries?.map(({ name, calorieCount, id }) => (
						<MealSummaryCard key={id} title={name} calories={calorieCount} />
					))}
				</Stack>
			</ScrollArea>
		</>
	);
};

interface MealSummaryCardProps {
	title: MealCategoryType;
	calories?: number;
}

const MealSummaryCard = ({ title, calories }: MealSummaryCardProps) => {
	const IconMap: Record<MealCategoryType, IconName> = {
		Breakfast: 'Coffee', // Maybe Egg or EggFried??
		Lunch: 'Salad', // or cheese?
		Dinner: 'Soup', // Sausage? Soup? Fish?
		Snack: 'Cookie', // or ice cream?
	};

	const iconName = IconMap[title];
	const Icon = Icons[iconName];

	const { colors } = useMantineTheme();
	console.log('calories: ', calories);

	return (
		<Card>
			<Group position='apart'>
				<Group>
					<Icon size={30} />
					<Text>
						{title} {calories ? `- ${calories} calories` : ''}
					</Text>
				</Group>
				<Icons.CirclePlus
					strokeWidth={1}
					size={35}
					fill={colors.primaryPink[3]}
					color={colors.neutral[6]}
				/>
			</Group>
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
