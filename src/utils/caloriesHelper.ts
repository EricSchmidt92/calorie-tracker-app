interface CalcTotalCaloriesArgs {
	eatenServingSize: number;
	standardServingSize: number;
	caloriesPerServing: number;
}

export const calculateTotalCalories = (calorieInfo: CalcTotalCaloriesArgs) => {
	const { standardServingSize, eatenServingSize, caloriesPerServing } = calorieInfo;
	const caloriesPerUnitOfMeasurement = caloriesPerServing / standardServingSize;

	return Math.round(eatenServingSize * caloriesPerUnitOfMeasurement);
};
