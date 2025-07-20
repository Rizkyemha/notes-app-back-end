/* eslint-disable import/no-extraneous-dependencies */

const { nanoid } = require("nanoid");
const { Pool } = require("pg");
const InvariantError = require("../../api/notes/exceptions/InvariantError");
const NotFoundError = require("../../api/notes/exceptions/NotFoundError");
const { mapDBToModel } = require("../../utils");

class NotesService {
	constructor() {
		this._pool = new Pool();
	}

	async addNote({ title, body, tags }) {
		const id = nanoid(16);
		const createdAt = new Date().toISOString();
		const updatedAt = createdAt;

		const query = {
			text: `INSERT INTO notes (id, title, body, tags, created_at, updated_at) 
              VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
			values: [id, title, body, tags, createdAt, updatedAt],
		};

		const result = await this._pool.query(query);

		if (!result.rows[0].id) {
			throw new InvariantError("Catatan gagal ditambahkan");
		}

		return result.rows[0].id;
	}

	async getNotes() {
		const result = await this._pool.query(
			"SELECT id, title, body, tags, created_at, updated_at FROM notes"
		);
		return result.rows.map(mapDBToModel);
	}

	async getNoteById(id) {
		const query = {
			text: "SELECT id, title, body, tags, created_at, updated_at FROM notes WHERE id = $1",
			values: [id],
		};

		const result = await this._pool.query(query);

		if (!result.rows.length) {
			throw new NotFoundError("Catatan tidak ditemukan");
		}
		return result.rows.map(mapDBToModel)[0];
	}

	async updateNoteById(id, { title, body, tags }) {
		const updatedAt = new Date().toISOString();

		const query = {
			text: "UPDATE notes SET title = $1, body = $2, tags = $3, updated_at = $4 WHERE id = $5 RETURNING id",
			values: [title, body, tags, updatedAt, id],
		};

		const result = await this._pool.query(query);

		if (!result.rows.length) {
			throw new NotFoundError(
				"Gagal memperbarui catatan. Id tidak ditemukan"
			);
		}
	}

	async deleteNoteById(id) {
		const query = {
			text: "DELETE FROM notes WHERE id = $1 RETURNING id",
			values: [id],
		};

		const result = await this._pool.query(query);

		if (!result.rows.length) {
			throw new NotFoundError(
				"Gagal memperbarui catatan. Id tidak ditemukan"
			);
		}
	}
}

module.exports = NotesService;
