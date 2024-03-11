import BarcodeScanner from '@/components/BarcodeScanner';
import { ModalProps } from '@/types/utils';
import { ActionIcon, Modal } from '@mantine/core';
import { X } from 'tabler-icons-react';

type ScannerModalProps = ModalProps & { onDetected: (barcode: string) => void };

const BarcodeScannerModal = ({ opened, onClose, onDetected }: ScannerModalProps) => {
	const handleOnClose = () => {
		onClose();
	};

	const handleOnDetected = (code: string | null) => {
		if (code) {
			onDetected(code);
			handleOnClose();
		}
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
				<Modal.Header>
					<ActionIcon aria-label='go back' variant='subtle' onClick={handleOnClose}>
						<X />
					</ActionIcon>

					<Modal.Title ta='center' style={{ flex: 2 }} fw='bold' pr='2rem'>
						Scan Barcode
					</Modal.Title>
				</Modal.Header>

				<Modal.Body>
					<BarcodeScanner onDetected={({ codeResult }) => handleOnDetected(codeResult.code)} />
				</Modal.Body>
			</Modal.Content>
		</Modal.Root>
	);
};

export default BarcodeScannerModal;
