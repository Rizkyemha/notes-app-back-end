/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-tabs */
/* eslint-disable indent */
/* eslint-disable quotes */

require("dotenv").config();
const Hapi = require("@hapi/hapi");

// notes
const notes = require("./api/notes");
const NotesValidator = require("./validator/notes");
const NotesService = require("./services/postgres/NotesService");

// users
const users = require("./api/users");
const userValidator = require("./validator/users");
const UsersService = require("./services/postgres/UsersService");

// authentications
const authentications = require("./api/authentications");
const AuthenticationsService = require("./services/postgres/AuthenticationsService");
const TokenManager = require("./tokenize/TokenManager");
const AuthenticationsValidator = require("./validator/authentications");

const init = async () => {
	const notesService = new NotesService();
	const usersService = new UsersService();
	const authenticationsService = new AuthenticationsService();

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
		{
			plugin: authentications,
			options: {
				authenticationsService,
				usersService,
				tokenManger: TokenManager,
				authenticationsValidator: AuthenticationsValidator,
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
