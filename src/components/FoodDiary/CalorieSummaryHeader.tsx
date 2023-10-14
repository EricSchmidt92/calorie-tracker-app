import { Center, Group, RingProgress, Stack, Text, rem } from '@mantine/core';

export interface CalorieSummaryHeaderProps {
	caloriesLimit: number;
	caloriesConsumed: number;
}

const CalorieSummaryHeader = ({ caloriesConsumed, caloriesLimit }: CalorieSummaryHeaderProps) => {
	const calorieLimitPercentage = Math.round((caloriesConsumed / caloriesLimit) * 100);
	return (
		<Group justify='center' gap={0}>
			<HeaderSubText calories={caloriesConsumed} text='eaten' />
			<RingProgress
				label={
					<Center>
						<Stack gap={0} align='center'>
							<Text size={rem(35)} fw='bold'>
								{caloriesLimit - caloriesConsumed}
							</Text>
							<Text size='xs' fw='bold' tt='uppercase'>
								cal left
							</Text>
						</Stack>
					</Center>
				}
				sections={[{ value: calorieLimitPercentage, color: 'primaryPink.3' }]}
				size={200}
				thickness={8}
				rootColor='neutral.4'
				roundCaps
			/>
			<HeaderSubText calories={0} text='burned' />
		</Group>
	);
};

export default CalorieSummaryHeader;

const HeaderSubText = ({ calories, text }: { calories: number; text: string }) => (
	<Stack align='center' gap={0}>
		<Text size='sm' fw='bold'>
			{calories}
		</Text>
		<Text size='0.7em' fw='bold' tt='uppercase'>
			{text}
		</Text>
	</Stack>
);
