import { TRPCError } from '@trpc/server';
import { DateTime } from 'luxon';

export const validateISOString = (dateTime: DateTime) => {
	if (!dateTime.isValid) {
		throw new TRPCError({
			message: 'Invalid date time string',
			code: 'BAD_REQUEST',
		});
	}
};

export const validateAndGetDayBoundaries = (dateTime: DateTime) => {
	validateISOString(dateTime);

	const dayStart = dateTime.startOf('day').toISO();
	const dayEnd = dateTime.endOf('day').toISO();

	if (!dayStart || !dayEnd) {
		throw new TRPCError({
			code: 'BAD_REQUEST',
			message: 'Invalid date for day passed in',
		});
	}

	return { dayStart, dayEnd };
};
