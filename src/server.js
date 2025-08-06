/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-tabs */
/* eslint-disable indent */
/* eslint-disable quotes */

require("dotenv").config();
const Hapi = require("@hapi/hapi");
const Jwt = require("@hapi/jwt");
const Inert = require("@hapi/inert");
const path = require("path");

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
const _exports = require("./api/exports");
const ExportsValidator = require("./validator/exports");
const ProducerService = require("./services/rabbitmq/producerService");

// uploads
const uploads = require("./api/uploads");
const uploadValidator = require("./validator/uploads");
const StorageService = require("./services/storage/storageService");

// cache
const CacheService = require("./services/redis/CacheService");

const init = async () => {
	const cacheService = new CacheService();

	const collaborationsService = new CollaborationsService(cacheService);
	const notesService = new NotesService(collaborationsService, cacheService);
	const usersService = new UsersService();
	const authenticationsService = new AuthenticationsService();
	const producerService = ProducerService;
	const storageService = new StorageService(
		path.resolve(__dirname, "api/uploads/file/images")
	);

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
			plugin: Jwt,
		},
		{
			plugin: Inert,
		},
	]);

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
			plugin: _exports,
			options: {
				service: producerService,
				validator: ExportsValidator,
			},
		},
		{
			plugin: uploads,
			options: {
				service: storageService,
				validator: uploadValidator,
			},
		},
	]);

	server.ext("onPreResponse", (request, h) => {
		const { response } = request;

		console.log(response.message);

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
