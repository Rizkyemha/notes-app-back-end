const InvariantError = require("../../api/notes/exceptions/InvariantError");
const {
	PostAuthenticationsPayloadSchema,
	PutAuthenticationsPayloadSchema,
	DeleteAuthenticationsPayloadSchema,
} = require("./schema");

const AuthenticationsValidator = {
	validatePostAuthenticationsPayload: (payload) => {
		console.log("Validator jalan");
		const validationResult =
			PostAuthenticationsPayloadSchema.validate(payload);
		if (validationResult.error) {
			throw new InvariantError(validationResult.error.message);
		}
	},
	validatePutAuthenticationsPayload: (payload) => {
		const validateResult = PutAuthenticationsPayloadSchema.validate(payload);
		if (validateResult.error) {
			throw new InvariantError(validateResult.error.message);
		}
	},
	validateDeleteAuthenticationsPayload: (payload) => {
		const validateResult =
			DeleteAuthenticationsPayloadSchema.validate(payload);
		if (validateResult.error) {
			throw new InvariantError(validateResult.error.message);
		}
	},
};

module.exports = AuthenticationsValidator;
