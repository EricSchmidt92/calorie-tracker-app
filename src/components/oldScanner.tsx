import Quagga, { Barcode } from '@ericblade/quagga2';
import { useEffect, useRef } from 'react';

interface BarcodeScannerProps {
	onDetected: (result: any) => void;
}

const BarcodeScanner = ({ onDetected }: BarcodeScannerProps) => {
	const scannerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (scannerRef.current) {
			Quagga.init(
				{
					inputStream: {
						type: 'LiveStream',
						target: scannerRef.current,
						constraints: {
							facingMode: 'environment',
						},
					},
					decoder: {
						readers: [
							'code_128_reader',
							'ean_reader',
							'ean_8_reader',
							'upc_reader',
							'upc_e_reader',
						],
					},
				},
				err => {
					if (err) {
						console.error(err);
						return;
					}
					Quagga.start();
				}
			);

			Quagga.onDetected(data => onDetected(data));
		}

		return () => {
			console.log('running cleanup now');
			Quagga.stop();
			Quagga.offDetected(onDetected);
			if (Quagga.CameraAccess) {
				Quagga.CameraAccess.release(); // Explicitly release the camera stream
			}
		};
	}, [onDetected]);

	return <div ref={scannerRef} style={{ width: '100%', height: '100%' }}></div>;
};

export default BarcodeScanner;
