import styles from './index.module.css';
import { signIn, signOut, useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { api } from '@/utils/api';
import { ReactElement, useEffect } from 'react';
import { NextPageWithLayout } from './_app';
import { Box, Button } from '@mantine/core';

const Home: NextPageWithLayout = () => {
	const hello = api.example.hello.useQuery({ text: 'from tRPC' });

	return (
		<>
			<Head>
				<title>Calorie Tracker</title>
				<meta
					name='description'
					content='For helping your diet stay on track'
				/>
				<link rel='icon' href='/favicon.ico' />
				<meta
					name='viewport'
					content='minimum-scale=1, initial-scale=1, width=device-width'
				/>
			</Head>
			my page is here....my changes....
			<p>{hello.data ? hello.data.greeting : 'Loading tRPC query...'}</p>
			<AuthShowcase />
		</>
	);
};

Home.getLayout = function getLayout(page: ReactElement) {
	return <Box>{page}</Box>;
};

function AuthShowcase() {
	const { data: sessionData } = useSession();

	const { data: secretMessage } = api.example.getSecretMessage.useQuery(
		undefined, // no input
		{ enabled: sessionData?.user !== undefined }
	);

	return (
		<div className={styles.authContainer}>
			<p className={styles.showcaseText}>
				{sessionData && <span>Logged in as {sessionData.user?.name}</span>}
				{secretMessage && <span> - {secretMessage}</span>}
			</p>
			stuff
			<Button
				onClick={sessionData ? () => void signOut() : () => void signIn()}
			>
				{sessionData ? 'Sign out' : 'Sign in'}
			</Button>
		</div>
	);
}

export default Home;
