const ClientError = require("./ClientError");

class AuthorizationError extends ClientError {
	constructor(message = "Anda tidak berhak melakukan ini") {
		super(message, 403);
		this.name = "AuthorizationError";
	}
}

module.exports = AuthorizationError;
