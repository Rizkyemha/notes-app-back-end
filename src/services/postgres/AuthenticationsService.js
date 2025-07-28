const { Pool } = require("pg");
const InvariantError = require("../../api/notes/exceptions/InvariantError");

class AuthenticationsService {
	construktor() {
		this._pool = new Pool();
	}

	async addRefreshToken(token) {
		const query = {
			text: "INSERT INTO authentications VALUES ($1) RETURNING",
			values: [token],
		};

		await this._pool.query(query);
	}

	async verifyRefreshToken(token) {
		const query = {
			text: "SELECT token FROM authentications WHERE token = $1",
			values: [token],
		};

		const result = await this._pool.query(query);

		if (!result.rows.length) {
			throw new InvariantError("Refresh token tidak ditemukan");
		}
	}

	async deleteRefreshToken(token) {
		const query = {
			text: "DELETE FROM authentications WHERE token = $1",
			values: [token],
		};

		await this._pool.query(query);
	}
}

module.exports = AuthenticationsService;
