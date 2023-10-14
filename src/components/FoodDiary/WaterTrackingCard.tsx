import classes from '@/styles/diaryIndex.module.css';
import { api } from '@/utils/api';
import { ActionIcon, Alert, Box, Group, Loader, Paper, Text } from '@mantine/core';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import * as Icons from 'tabler-icons-react';
import { v4 as uuidV4 } from 'uuid';

const WaterTrackingCard = () => {
	const router = useRouter();
	const day = router.query.date as string;
	const [numCups, setNumCups] = useState(0);

	const utils = api.useContext();
	const {
		data: goalData,
		isLoading: goalIsLoading,
		error: goalError,
	} = api.goals.getGoals.useQuery({
		select: { waterIntake: true },
	});

	const {
		data: entryData,
		isLoading: entryIsLoading,
		error: intakeError,
	} = api.waterIntakeDiary.getEntriesByDay.useQuery({
		day,
	});

	const { mutateAsync: addWaterEntryMutation } = api.waterIntakeDiary.addEntry.useMutation();
	const { mutateAsync: removeWaterEntryMutation } = api.waterIntakeDiary.removeEntry.useMutation();

	const handleAddWaterEntry = async () => {
		await addWaterEntryMutation(undefined, {
			onError: err => console.error('error with water entry: ', err),
			onSuccess: () => utils.waterIntakeDiary.getEntriesByDay.invalidate({ day }),
		});
	};

	const handleRemoveWaterEntry = async (entryId: string) => {
		await removeWaterEntryMutation(
			{ entryId },
			{
				onError: err => console.error('error with removing entry: ', err),
				onSuccess: () => utils.waterIntakeDiary.getEntriesByDay.invalidate({ day }),
			}
		);
	};

	useEffect(() => {
		if (goalData) {
			let defaultCups = goalData.waterIntake;

			if (entryData) defaultCups = Math.max(defaultCups, entryData.length);

			setNumCups(defaultCups);
		}
	}, [entryData, goalData]);

	if (goalIsLoading || entryIsLoading) {
		return <Loader />;
	}

	if (goalError) {
		return <Alert color='error.4'>Error getting your default water intake amount</Alert>;
	}

	if (intakeError) {
		return <Alert color='error.4'>Error getting your water intake for the day</Alert>;
	}

	return (
		<Paper>
			<Text p='sm' fz='lg' ta='center'>
				Water
			</Text>
			<Group p='sm'>
				{entryData &&
					entryData.map(entry => (
						<ActionIcon key={entry.id} variant='subtle' color='info.3' size='xl'>
							<Icons.Bottle onClick={() => handleRemoveWaterEntry(entry.id)} size={40} />
						</ActionIcon>
					))}

				{goalData?.waterIntake &&
					Array.from({ length: Math.max(numCups - (entryData ? entryData.length : 0), 0) }).map(
						(_, index) => (
							<Box
								h='44px'
								w='44px'
								key={`empty-cup-${uuidV4()}`}
								className={classes.waterIconContainer}
							>
								<Icons.Bottle size={40} />
							</Box>
						)
					)}

				<ActionIcon variant='subtle' size='xl' onClick={handleAddWaterEntry}>
					<Icons.Plus size={40} />
				</ActionIcon>
			</Group>
		</Paper>
	);
};

export default WaterTrackingCard;
