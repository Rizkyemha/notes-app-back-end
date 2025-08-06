const routes = (handler) => [
	{
		method: "POST",
		path: "/upload/images",
		handler: handler.postUploadsImageHandler,
		options: {
			payload: {
				allow: "multipart/form-data",
				multipart: true,
				output: "stream",
			},
		},
	},
];

module.exports = routes;
