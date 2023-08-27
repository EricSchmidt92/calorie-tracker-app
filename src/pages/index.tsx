import styles from './index.module.css';
import { signIn, signOut, useSession } from 'next-auth/react';
import Head from 'next/head';
import { api } from '@/utils/api';
import { ReactElement, useEffect } from 'react';
import { NextPageWithLayout } from './_app';
import { Box, Button, Card, Stack } from '@mantine/core';
import { DateTime } from 'luxon';

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
	const { data, error } = api.foodEntries.getDailyCalorieSummary.useQuery({
		day: DateTime.now().toISODate() ?? '',
	});

	if (error) {
		console.error('error getting data: ', error);
	}

	console.log(data);

	return (
		<>
			<Head>
				<title>Calorie Tracker</title>
				<meta name='description' content='For helping your diet stay on track' />
				<link rel='icon' href='/favicon.ico' />
				<meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width' />
			</Head>
			<AuthShowcase />
			<Stack>
				<MealSummaryCard />
			</Stack>
		</>
	);
};

const MealSummaryCard = () => {
	return <Card>Card</Card>;
};

function AuthShowcase() {
	return (
		<div className={styles.authContainer}>
			<Button onClick={() => void signOut()}>Sign out</Button>
		</div>
	);
}

export default Home;
