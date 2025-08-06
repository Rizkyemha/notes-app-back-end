const uploadsPayloadSchema = require("./schema");
const InvariantError = require("../../api/notes/exceptions/InvariantError");

const uploadValidator = {
	validateImageHeader: (headers) => {
		const validationResult = uploadsPayloadSchema.validate(headers);

		if (validationResult.error) {
			throw new InvariantError(validationResult.error.message);
		}
	},
};

module.exports = uploadValidator;
