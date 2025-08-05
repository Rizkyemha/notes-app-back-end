const ExportNotesPayloadSchema = require("./schema");
const InvariantError = require("../../api/notes/exceptions/InvariantError");

const ExportsValidator = {
	validateExportNotesPayload: (payload) => {
		const validationResult = ExportNotesPayloadSchema.validate(payload);

		if (validationResult.error) {
			throw new InvariantError(validationResult.error.message);
		}
	},
};

module.exports = ExportsValidator;
