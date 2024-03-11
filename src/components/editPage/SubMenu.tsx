import { ActionIcon, Group, Menu, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Dots, Plus } from 'tabler-icons-react';
import CreateFoodModal from './CreateFoodModal';

const SubMenu = () => {
	const [opened, { open, close }] = useDisclosure(false);
	return (
		<>
			<Menu position='bottom-end' offset={2} transitionProps={{ transition: 'scale-y' }}>
				<Menu.Target>
					<ActionIcon aria-label='more options' size='md' variant='subtle'>
						<Dots size='4rem' />
					</ActionIcon>
				</Menu.Target>

				<Menu.Dropdown bg='base.4'>
					<Menu.Item onClick={open}>
						<Group>
							<Text>Create food</Text>
							<Plus />
						</Group>
					</Menu.Item>
				</Menu.Dropdown>
			</Menu>

			<CreateFoodModal opened={opened} onClose={close} />
		</>
	);
};

export default SubMenu;
