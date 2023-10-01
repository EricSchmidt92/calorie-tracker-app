import { ColorSchemeScript } from '@mantine/core';
import { createGetInitialProps } from '@mantine/next';
import Document, { Html, Main, Head, NextScript } from 'next/document';

const getInitialProps = createGetInitialProps();

class MyDocument extends Document {
	static getInitialProps = getInitialProps;

	render() {
		return (
			<Html>
				<Head>
					<link rel='manifest' href='/manifest.json' />
					<link rel='apple-touch-icon' href='/logo.png' />
					<ColorSchemeScript defaultColorScheme='dark' />
				</Head>
				<body>
					<Main />
					<NextScript />
				</body>
			</Html>
		);
	}
}

export default MyDocument;
