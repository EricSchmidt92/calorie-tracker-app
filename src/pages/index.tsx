import { Text } from '@mantine/core';
import { DateTime } from 'luxon';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { NextPageWithLayout } from './_app';

const Home: NextPageWithLayout = () => {
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

			<HomeAuthenticated />
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
