/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-tabs */
/* eslint-disable indent */
/* eslint-disable quotes */

require("dotenv").config();
const Hapi = require("@hapi/hapi");
const notes = require("./api/notes");
const NotesValidator = require("./validator/notes");
const NotesService = require("./services/postgres/NotesService");
const users = require("./api/users");
const userValidator = require("./validator/users");
const UsersService = require("./services/postgres/UsersService");

const init = async () => {
	const notesService = new NotesService();
	const usersService = new UsersService();

	const server = Hapi.server({
		port: process.env.PORT,
		host: process.env.HOST,
		routes: {
			cors: {
				origin: ["*"],
			},
		},
	});

	await server.register([
		{
			plugin: notes,
			options: {
				service: notesService,
				validator: NotesValidator,
			},
		},
		{
			plugin: users,
			options: {
				service: usersService,
				validator: userValidator,
			},
		},
	]);

	server.ext("onPreResponse", (request, h) => {
		const { response } = request;

		if (response instanceof Error) {
			const newError = h.response({
				status: "fail",
				message: response.message,
			});
			newError.code(response.statusCode);
			return newError;
		}
		return h.continue;
	});

	await server.start();
	console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
