/* eslint-disable import/no-extraneous-dependencies */

const { nanoid } = require("nanoid");
const { Pool } = require("pg");
const InvariantError = require("../../api/notes/exceptions/InvariantError");
const AuthorizationError = require("../../api/notes/exceptions/AuthorizationError");
const NotFoundError = require("../../api/notes/exceptions/NotFoundError");
const { mapDBToModel } = require("../../utils");

class NotesService {
	constructor(collaborationService, cacheService) {
		this._pool = new Pool();
		this._collaborationService = collaborationService;
		this._cacheService = cacheService;
	}

	async verifyNoteAccess(noteId, userId) {
		try {
			await this.verifyNoteOwner(noteId, userId);
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error;
			}
			try {
				await this._collaborationService.verifyCollaborator(noteId, userId);
			} catch {
				throw error;
			}
		}
	}

	async verifyNoteOwner(id, owner) {
		const query = {
			text: "SELECT id, title, body, tags, created_at, updated_at, owner FROM notes WHERE id = $1",
			values: [id],
		};

		const result = await this._pool.query(query);

		if (!result.rows.length) {
			throw new NotFoundError("Resource yang Anda minta tidak ditemukan");
		}

		const note = result.rows[0];

		if (note.owner !== owner) {
			throw new AuthorizationError(
				"Anda tidak berhak mengakses resource ini"
			);
		}
	}

	async addNote({ title, body, tags, owner }) {
		const id = nanoid(16);
		const createdAt = new Date().toISOString();
		const updatedAt = createdAt;

		const query = {
			text: `INSERT INTO notes (id, title, body, tags, created_at, updated_at, owner) 
              VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
			values: [id, title, body, tags, createdAt, updatedAt, owner],
		};

		const result = await this._pool.query(query);

		if (!result.rows[0].id) {
			throw new InvariantError("Catatan gagal ditambahkan");
		}

		await this._cacheService.delete(`notes:${owner}`);

		return result.rows[0].id;
	}

	async getNotes(owner) {
		try {
			const cacheNotes = await this._cacheService.get(`notes:${owner}`);
			return JSON.parse(cacheNotes);
		} catch (error) {
			const query = {
				text: `SELECT notes.* FROM notes
							LEFT JOIN collaborations ON collaborations.note_id = notes.id
							WHERE notes.owner = $1 OR collaborations.user_id = $1
							GROUP BY notes.id`,
				values: [owner],
			};

			const result = await this._pool.query(query);

			if (!result.rows.length) {
				throw new NotFoundError("Catatan tidak ditemukan");
			}

			const mappedResult = result.rows.map(mapDBToModel);

			await this._cacheService.set(
				`notes:${owner}`,
				JSON.stringify(mappedResult)
			);

			return mappedResult;
		}
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
			text: "UPDATE notes SET title = $1, body = $2, tags = $3, updated_at = $4 WHERE id = $5 RETURNING id, owner",
			values: [title, body, tags, updatedAt, id],
		};

		const result = await this._pool.query(query);

		if (!result.rows.length) {
			throw new NotFoundError(
				"Gagal memperbarui catatan. Id tidak ditemukan"
			);
		}

		const { owner } = result.rows[0];
		await this._cacheService.delete(`notes:${owner}`);
	}

	async deleteNoteById(id) {
		const query = {
			text: "DELETE FROM notes WHERE id = $1 RETURNING id, owner",
			values: [id],
		};

		const result = await this._pool.query(query);

		if (!result.rows.length) {
			throw new NotFoundError(
				"Gagal memperbarui catatan. Id tidak ditemukan"
			);
		}
		const { owner } = result.rows[0];
		await this._cacheService.delete(`notes:${owner}`);
	}
}

module.exports = NotesService;
