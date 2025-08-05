/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-tabs */
/* eslint-disable indent */
/* eslint-disable quotes */

require("dotenv").config();
const Hapi = require("@hapi/hapi");
const Jwt = require("@hapi/jwt");

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
const TokenManager = require("./tokenize/TokenManager");
const AuthenticationsValidator = require("./validator/authentications");
const AuthenticationsService = require("./services/postgres/AuthenticationsService");

// collaborations
const collaborations = require("./api/collaborations");
const CollaborationsService = require("./services/postgres/CollaborationsService");
const CollaborationsValidator = require("./validator/collaborations");

// exports
const exports = require("./api/exports");
const ExportsValidator = require("./validator/exports");
const ProducerService = require("./services/rabbitmq/producerService");

const init = async () => {
	const collaborationsService = new CollaborationsService();
	const notesService = new NotesService(collaborationsService);
	const usersService = new UsersService();
	const authenticationsService = new AuthenticationsService();
	const producerService = new ProducerService();

	const server = Hapi.server({
		port: process.env.PORT,
		host: process.env.HOST,
		routes: {
			cors: {
				origin: ["*"],
			},
		},
	});

	await server.register({
		plugin: Jwt,
	});

	server.auth.strategy("notesapp_jwt", "jwt", {
		keys: process.env.ACCESS_TOKEN_KEY,
		verify: {
			aud: false,
			iss: false,
			sub: false,
			maxAgeSec: process.env.ACCESS_TOKEN_AGE,
		},
		validate: (artifacts) => ({
			isValid: true,
			credential: {
				id: artifacts.decoded.payload.id,
			},
		}),
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
				tokenManager: TokenManager,
				validator: AuthenticationsValidator,
			},
		},
		{
			plugin: collaborations,
			options: {
				collaborationsService,
				notesService,
				validator: CollaborationsValidator,
			},
		},
		{
			plugin: exports,
			options: {
				service: producerService,
				validator: ExportsValidator,
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
