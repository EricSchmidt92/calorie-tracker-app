import { api } from '@/utils/api';
import { Alert, Button, Center, Loader, NumberInput, Stack, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import React from 'react';

interface FormValues {
	goalWeight: number;
	calorieLimit: number;
}

const Profile = () => {
	const { data: profile, isLoading } = api.profile.getProfile.useQuery();
	const { mutateAsync: updateGoalsMutation } = api.goals.updateGoals.useMutation();
	const utils = api.useContext();
	const router = useRouter();

	const updateGoals = async (values: FormValues) => {
		await updateGoalsMutation(
			{
				...values,
			},
			{
				onError: error => console.error(error),
				onSuccess: () => utils.profile.getProfile.invalidate(),
			}
		);
	};

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

	const { name, goals } = profile;

	return (
		<Center>
			<Stack>
				<Title>Welcome {name && name}</Title>

				<GoalsForm
					calorieLimit={goals?.calorieLimit ?? 0}
					goalWeight={goals?.goalWeight ?? 0}
					onSubmit={updateGoals}
				/>

				<Button
					onClick={async () => {
						//TODO: this doesn't work figure out the auth context?
						await signOut();
						router.push('/login');
					}}
					mt={100}
				>
					Log Out
				</Button>
			</Stack>
		</Center>
	);
};

export default Profile;

interface GoalsFormProps extends FormValues {
	onSubmit: (values: FormValues) => void;
}

const GoalsForm = ({ goalWeight, calorieLimit, onSubmit }: GoalsFormProps) => {
	const form = useForm<FormValues>({
		initialValues: {
			goalWeight,
			calorieLimit,
		},

		validate: {
			goalWeight: value => (value < 0 ? 'Goal Weight cannot be negative' : null),
			calorieLimit: value => (value < 0 ? 'Calorie Limit cannot be negative' : null),
		},
	});

	return (
		<form onSubmit={form.onSubmit(onSubmit)}>
			<NumberInput
				label='Daily Calorie Limit'
				{...form.getInputProps('calorieLimit')}
				allowNegative={false}
			/>

			<NumberInput
				label='Goal Weight'
				{...form.getInputProps('goalWeight')}
				allowNegative={false}
			/>
			<Button type='submit'>Update</Button>
		</form>
	);
};
