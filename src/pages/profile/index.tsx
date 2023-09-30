import { api } from '@/utils/api';
import { Alert, Center, Loader, Stack, Text, Title } from '@mantine/core';
import React from 'react';

const Profile = () => {
	const { data: profile, isLoading } = api.profile.getProfile.useQuery();

	if (isLoading) {
		return (
			<Center>
				<Loader size='xl' />
			</Center>
		);
	}

	if (!profile) {
		return (
			<Center>
				<Alert color='error.4'>Error getting profile data please try again</Alert>
			</Center>
		);
	}

	const { goals, name } = profile;
	const calorieLimit = goals?.calorieLimit ?? 0;
	const goalWeight = goals?.goalWeight ?? 0;

	return (
		<Center>
			<Stack>
				<Title>Welcome {name && name}</Title>
				<Text>Daily Calorie Limit: {calorieLimit}</Text>
				<Text>Goal Weight: {goalWeight}</Text>

				{name}
			</Stack>
		</Center>
	);
};

export default Profile;
