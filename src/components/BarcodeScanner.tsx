import Quagga, {
	QuaggaJSCodeReader,
	QuaggaJSReaderConfig,
	QuaggaJSResultObject,
} from '@ericblade/quagga2';
import { Box, Button, List, Select, Text } from '@mantine/core';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * This page was taken form the quagga2 github example and modified accordingly: https://github.com/ericblade/quagga2-react-example/tree/master
 */

const BarcodeScanner = ({ onDetected }: { onDetected: (result: QuaggaJSResultObject) => void }) => {
	const [scanning, setScanning] = useState(false); // toggleable state for "should render scanner"
	const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]); // array of available cameras, as returned by Quagga.CameraAccess.enumerateVideoDevices()
	const [cameraId, setCameraId] = useState<string | null>(null); // id of the active camera device
	const [cameraError, setCameraError] = useState(null); // error message from failing to access the camera
	const [results, setResults] = useState<QuaggaJSResultObject[]>([]); // list of scanned results
	const [torchOn, setTorch] = useState(false); // toggleable state for "should torch be on"
	const scannerRef = useRef(null); // reference to the scanner element in the DOM

	// at start, we need to get a list of the available cameras.  We can do that with Quagga.CameraAccess.enumerateVideoDevices.
	// HOWEVER, Android will not allow enumeration to occur unless the user has granted camera permissions to the app/page.
	// AS WELL, Android will not ask for permission until you actually try to USE the camera, just enumerating the devices is not enough to trigger the permission prompt.
	// THEREFORE, if we're going to be running in Android, we need to first call Quagga.CameraAccess.request() to trigger the permission prompt.
	// AND THEN, we need to call Quagga.CameraAccess.release() to release the camera so that it can be used by the scanner.
	// AND FINALLY, we can call Quagga.CameraAccess.enumerateVideoDevices() to get the list of cameras.

	// Normally, I would place this in an application level "initialization" event, but for this demo, I'm just going to put it in a useEffect() hook in the App component.

	useEffect(() => {
		const enableCamera = async () => {
			await Quagga.CameraAccess.request(null, {});
		};

		const disableCamera = async () => {
			await Quagga.CameraAccess.release();
		};

		const enumerateCameras = async () => {
			const cameras = await Quagga.CameraAccess.enumerateVideoDevices();
			console.log('Cameras Detected: ', cameras);
			return cameras;
		};

		enableCamera()
			.then(disableCamera)
			.then(enumerateCameras)
			.then(cameras => setCameras(cameras))
			.then(() => Quagga.CameraAccess.disableTorch()) // disable torch at start, in case it was enabled before and we hot-reloaded
			.catch(err => setCameraError(err));

		return () => {
			disableCamera();
		};
	}, []);

	// useEffect(() => {
	// 	console.log('results: ', results);
	// }, [results]);

	// provide a function to toggle the torch/flashlight
	// const onTorchClick = useCallback(() => {
	// 	const torch = !torchOn;
	// 	setTorch(torch);
	// 	if (torch) {
	// 		Quagga.CameraAccess.enableTorch();
	// 	} else {
	// 		Quagga.CameraAccess.disableTorch();
	// 	}
	// }, [torchOn, setTorch]);

	return (
		<Box>
			{cameraError ? (
				<Text>
					ERROR INITIALIZING CAMERA ${JSON.stringify(cameraError)} -- DO YOU HAVE PERMISSION?
				</Text>
			) : null}
			{cameras.length === 0 ? (
				<Text>Enumerating Cameras, browser may be prompting for permissions beforehand</Text>
			) : (
				<form>
					<Select
						data={cameras.map(({ deviceId, label }) => ({ label, value: deviceId }))}
						value={cameras[0]?.deviceId}
						onChange={id => setCameraId(id)}
					></Select>
				</form>
			)}
			{/* <button onClick={onTorchClick}>{torchOn ? 'Disable Torch' : 'Enable Torch'}</button> */}
			<Button onClick={() => setScanning(!scanning)}>{scanning ? 'Stop' : 'Start'}</Button>
			<List className='results'>
				{results.map(
					result => result.codeResult && <Result key={result.codeResult.code} result={result} />
				)}
			</List>
			<Box ref={scannerRef} style={{ position: 'relative', border: '3px solid red' }}>
				<canvas
					className='drawingBuffer'
					style={{
						position: 'absolute',
						top: '0px',
						// left: '0px',
						// height: '100%',
						// width: '100%',
						border: '3px solid green',
					}}
					width='640'
					height='480'
				/>
				{scanning ? (
					<Scanner
						scannerRef={scannerRef}
						cameraId={cameraId}
						onDetected={onDetected}
						decoders={['upc_reader']}
					/>
				) : null}
			</Box>
		</Box>
	);
};

export default BarcodeScanner;

const Result = ({ result }: { result: QuaggaJSResultObject }) => (
	<li>
		{result.codeResult.code} [{result.codeResult.format}]
	</li>
);

function getMedian(arr: any[]) {
	const newArr = [...arr]; // copy the array before sorting, otherwise it mutates the array passed in, which is generally undesirable
	newArr.sort((a, b) => a - b);
	const half = Math.floor(newArr.length / 2);
	if (newArr.length % 2 === 1) {
		return newArr[half];
	}
	return (newArr[half - 1] + newArr[half]) / 2;
}

function getMedianOfCodeErrors(decodedCodes: QuaggaJSResultObject['codeResult']['decodedCodes']) {
	const errors = decodedCodes.flatMap(x => x.error);
	const medianOfErrors = getMedian(errors);
	return medianOfErrors;
}

const defaultConstraints = {
	width: 640,
	height: 480,
};

const defaultLocatorSettings = {
	patchSize: 'medium',
	halfSample: true,
	willReadFrequently: true,
};

const defaultDecoders: (QuaggaJSReaderConfig | QuaggaJSCodeReader)[] = ['ean_reader', 'upc_reader'];

interface ScannerProps {
	onDetected: (result: QuaggaJSResultObject) => void;
	scannerRef: Record<string, any>;
	onScannerReady?: () => void;
	cameraId?: string | null;
	facingMode?: string;
	constraints?: Record<string, any>;
	locator?: Record<string, any>;
	decoders?: (QuaggaJSReaderConfig | QuaggaJSCodeReader)[];
	locate?: boolean;
}

const Scanner = ({
	onDetected,
	scannerRef,
	onScannerReady,
	cameraId,
	facingMode,
	constraints = defaultConstraints,
	locator = defaultLocatorSettings,
	decoders = defaultDecoders,
	locate = true,
}: ScannerProps) => {
	const errorCheck = useCallback(
		(result: QuaggaJSResultObject) => {
			// console.log('result from error check: ', result);
			if (!onDetected) {
				return;
			}
			const err = getMedianOfCodeErrors(result.codeResult.decodedCodes);
			// if Quagga is at least 75% certain that it read correctly, then accept the code.
			if (err < 0.25) {
				onDetected(result);
			}
		},
		[onDetected]
	);

	const handleProcessed = (result: QuaggaJSResultObject) => {
		const drawingCtx = Quagga.canvas.ctx.overlay;
		const drawingCanvas = Quagga.canvas.dom.overlay;
		drawingCtx.font = '24px Arial';
		drawingCtx.fillStyle = 'green';

		if (result) {
			// console.warn('* quagga onProcessed', result);
			if (result.boxes) {
				drawingCtx.clearRect(
					0,
					0,
					parseInt(drawingCanvas.getAttribute('width') ?? ''),
					parseInt(drawingCanvas.getAttribute('height') ?? '')
				);
				result.boxes
					.filter(box => box !== result.box)
					.forEach(box => {
						Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, {
							color: 'purple',
							lineWidth: 2,
						});
					});
			}
			if (result.box) {
				Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, {
					color: 'blue',
					lineWidth: 2,
				});
			}
			if (result.codeResult && result.codeResult.code) {
				// const validated = barcodeValidator(result.codeResult.code);
				// const validated = validateBarcode(result.codeResult.code);
				// Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: validated ? 'green' : 'red', lineWidth: 3 });
				drawingCtx.font = '24px Arial';
				// drawingCtx.fillStyle = validated ? 'green' : 'red';
				// drawingCtx.fillText(`${result.codeResult.code} valid: ${validated}`, 10, 50);
				drawingCtx.fillText(result.codeResult.code, 10, 20);
				// if (validated) {
				//     onDetected(result);
				// }
			}
		}
	};

	useLayoutEffect(() => {
		// if this component gets unmounted in the same tick that it is mounted, then all hell breaks loose,
		// so we need to wait 1 tick before calling init().  I'm not sure how to fix that, if it's even possible,
		// given the asynchronous nature of the camera functions, the non asynchronous nature of React, and just how
		// awful browsers are at dealing with cameras.
		let ignoreStart = false;
		const init = async () => {
			// wait for one tick to see if we get unmounted before we can possibly even begin cleanup
			await new Promise(resolve => setTimeout(resolve, 1));
			if (ignoreStart) {
				return;
			}
			// begin scanner initialization
			await Quagga.init(
				{
					inputStream: {
						type: 'LiveStream',
						constraints: {
							...constraints,
							...(cameraId && { deviceId: cameraId }),
							...(!cameraId && { facingMode }),
						},
						target: scannerRef.current,
						willReadFrequently: true,
					},
					locator,
					decoder: { readers: decoders },
					locate,
				},
				async err => {
					Quagga.onProcessed(handleProcessed);

					if (err) {
						return console.error('Error starting Quagga:', err);
					}
					if (scannerRef && scannerRef.current) {
						await Quagga.start();
						if (onScannerReady) {
							onScannerReady();
						}
					}
				}
			);
			Quagga.onDetected(errorCheck);
		};
		init();
		// cleanup by turning off the camera and any listeners
		return () => {
			ignoreStart = true;
			Quagga.stop();
			Quagga.offDetected(errorCheck);
			Quagga.offProcessed(handleProcessed);
		};
	}, [
		cameraId,
		onDetected,
		onScannerReady,
		scannerRef,
		errorCheck,
		constraints,
		locator,
		decoders,
		locate,
		facingMode,
	]);
	return null;
};
