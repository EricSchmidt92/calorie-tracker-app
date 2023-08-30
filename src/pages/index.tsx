import { Button, Text } from '@mantine/core';
import { DateTime } from 'luxon';
import { signIn, useSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { NextPageWithLayout } from './_app';

const Home: NextPageWithLayout = () => {
	const { data: session } = useSession();

	return (
		<>
			<Head>
				<title>Calorie Tracker</title>
				<meta name='description' content='For helping your diet stay on track' />
				<link rel='icon' href='/favicon.ico' />
				<meta
					name='viewport'
					content='minimum-scale=1, initial-scale=1, width=device-width, maximum-scale=1, user-scalable=no'
				/>
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
	const router = useRouter();

	useEffect(() => {
		router.push(`/diary/${DateTime.now().toISODate()}`);
	});
	return <Text>Loading your Diary......</Text>;
};

export default Home;
