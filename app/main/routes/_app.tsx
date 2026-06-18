import { define } from '#/g/server.ts'

export default define.page(function App({ Component }) {
	return (
		<html>
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>AI 商店</title>
			</head>
			<body class='dark:bg-gray-900 dark:text-gray-100'>
				<Component />
			</body>
		</html>
	)
})
