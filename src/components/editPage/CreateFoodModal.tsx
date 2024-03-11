import { api } from '@/utils/api';
import {
	ActionIcon,
	Button,
	Modal,
	ModalProps,
	NumberInput,
	Select,
	Stack,
	TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { FoodItem, UnitOfMeasurement } from '@prisma/client';
import { X } from 'tabler-icons-react';

type ModalInitProps = Omit<FoodItem, 'id' | 'barcode'>;

const CreateFoodModal = ({ opened, onClose }: ModalProps) => {
	const form = useForm<ModalInitProps>({
		initialValues: {
			name: '',
			caloriesPerServing: 0,
			standardServingSize: 0,
			servingUnit: 'g',
		},
	});

	const { mutateAsync: createFoodItemMutation } = api.foodItem.create.useMutation();

	const selectVals: UnitOfMeasurement[] = ['g', 'mL'];

	const handleOnClose = () => {
		form.reset();
		onClose();
	};

	const createFoodItem = async (values: ModalInitProps) => {
		createFoodItemMutation(
			{
				...values,
			},
			{
				onError: error => console.error('something went wrong creating food item: ', error),
				onSuccess: item => {
					console.log('item successfully created!: ', item);
					handleOnClose();
				},
			}
		);
	};

	return (
		<Modal.Root
			opened={opened}
			onClose={handleOnClose}
			transitionProps={{ transition: 'slide-up', duration: 300 }}
			fullScreen
			style={() => ({
				body: {
					height: '90%',
				},
			})}
		>
			<Modal.Overlay />

			<Modal.Content>
				<Modal.Header style={{ justifyContent: 'space-between' }}>
					<ActionIcon aria-label='go back' variant='subtle' onClick={handleOnClose}>
						<X />
					</ActionIcon>

					<Modal.Title ta='center' style={{ flex: 2 }} fw='bold' pr='2rem'>
						Create Food
					</Modal.Title>
				</Modal.Header>

				<Modal.Body
					h='84%'
					display='flex'
					style={{ flexDirection: 'column', justifyContent: 'space-between' }}
				>
					<form onSubmit={form.onSubmit(createFoodItem)} style={{ height: '100%' }}>
						<Stack pt='lg' h='100%' w='100%' display='flex' justify='space-between'>
							<Stack>
								<TextInput
									required
									label='Food Name'
									placeholder='Chicken'
									{...form.getInputProps('name')}
								/>

								<NumberInput
									aria-label='Calories Per Serving'
									hideControls
									label='Calories Per Serving'
									{...form.getInputProps('caloriesPerServing')}
								/>

								<NumberInput
									required
									hideControls
									label='Standard Serving size'
									{...form.getInputProps('standardServingSize')}
								/>

								<Select
									required
									label='Serving Unit'
									placeholder={selectVals[0]}
									data={selectVals}
								/>
							</Stack>

							<Button tt='uppercase' type='submit' h={50}>
								Create Food
							</Button>
						</Stack>
					</form>
				</Modal.Body>
			</Modal.Content>
		</Modal.Root>
	);
};

export default CreateFoodModal;
