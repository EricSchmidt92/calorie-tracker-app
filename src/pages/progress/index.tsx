import { api } from '@/utils/api';
import { Alert, Box, Center, Loader, useMantineTheme } from '@mantine/core';
import { WeightDiary } from '@prisma/client';
import { DateTime } from 'luxon';
import { NextPage } from 'next';
import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { AlertCircle } from 'tabler-icons-react';

interface GridData {
	data: {
		id: string;
		weight: number;
		date: string;
	}[];
	xAxisTicks: string[];
	yAxisTicks: number[];
	yAxisDomain: number[];
}
const createChartData = (weightData: WeightDiary[]): GridData | undefined => {
	if (weightData.length <= 0) return;

	const firstDate = weightData[0]?.createdAt;
	const lastDate = weightData[weightData.length - 1]?.createdAt;
	if (!firstDate || !lastDate) return;

	const xAxisTicks = [firstDate, lastDate].map(entry => {
		const dt = DateTime.fromJSDate(new Date(entry));
		return dt.toFormat('LL/dd');
	});

	const weights = weightData.map(({ weight }) => weight);

	const minWeight = Math.min(...weights);
	const maxWeight = Math.min(...weights);
	const tickInterval = 5;

	const yAxisTicks: number[] = [];
	for (let i = minWeight; i <= maxWeight; i += tickInterval) {
		yAxisTicks.push(i);
	}

	const data = weightData.map(({ id, weight, createdAt }) => ({
		id,
		weight,
		date: DateTime.fromJSDate(createdAt).toFormat('LL/dd'),
	}));

	return {
		data,
		xAxisTicks,
		yAxisTicks,
		yAxisDomain: [minWeight, maxWeight],
	};
};

const ProgressPage: NextPage = () => {
	const { data, isLoading, error } = api.weightDiary.getEntries.useQuery();
	const theme = useMantineTheme();

	if (isLoading) {
		return (
			<Center>
				<Loader size='xl' />
			</Center>
		);
	}

	if (error) {
		return (
			<Center>
				<Alert icon={<AlertCircle />} title='Uh oh!' color='error.4'>
					Something went wrong loading your weight entries. Please try again!
				</Alert>
			</Center>
		);
	}

	const gridData = createChartData(data);
	return (
		<Box>
			{gridData && (
				<ResponsiveContainer width='100%' height={200}>
					<AreaChart
						data={gridData.data}
						margin={{
							top: 10,
							right: 30,
							left: 0,
							bottom: 0,
						}}
					>
						<CartesianGrid />
						<XAxis
							dataKey='date'
							type='category'
							domain={['dataMin', 'dataMax']}
							ticks={gridData.xAxisTicks}
							stroke={theme.colors.dark[0]}
						/>
						<YAxis type='number' domain={gridData.yAxisDomain} stroke={theme.colors.dark[0]} />
						<Area
							connectNulls
							dataKey='weight'
							type='linear'
							stroke={theme.colors.primaryPink[4]}
							fill={theme.colors.primaryPink[3]}
						/>
					</AreaChart>
				</ResponsiveContainer>
			)}
		</Box>
	);
};

export default ProgressPage;
