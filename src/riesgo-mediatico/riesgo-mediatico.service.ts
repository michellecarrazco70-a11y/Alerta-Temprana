import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, IsNull, Repository } from "typeorm";
import { basename, extname } from "path";

import { RiesgoMediatico } from "../entities/usr/riesgo-mediatico.entity";
import { AdrMedia } from "../entities/usr/adr-media.entity";

import { CreateRiesgoMediaticoDto } from "./dtos/create-riesgo-mediatico.dto";
import { UpdateRiesgoMediaticoDto } from "./dtos/update-riesgo-mediatico.dto";
import { FindRiesgosDto } from "./dtos/find-riesgos.dto";

@Injectable()
export class RiesgoMediaticoService {
	constructor(
		@InjectRepository(RiesgoMediatico)
		private readonly riesgoRepository: Repository<RiesgoMediatico>,

		@InjectRepository(AdrMedia)
		private readonly mediaRepository: Repository<AdrMedia>,

		private readonly dataSource: DataSource,
	) {}

	private readonly maxFileSize = 10 * 1024 * 1024;

	private readonly mimeTypes = new Set([
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"image/jpeg",
		"image/png",
	]);

	private readonly extensiones = new Set([
		".pdf",
		".doc",
		".docx",
		".xls",
		".xlsx",
		".jpg",
		".jpeg",
		".png",
	]);

	private validarArchivos(archivos: Express.Multer.File[]) {
		if (archivos.length > 5) {
			throw new BadRequestException("Máximo 5 archivos.");
		}

		for (const archivo of archivos) {
			const extension = extname(archivo.originalname).toLowerCase();

			if (
				!this.mimeTypes.has(archivo.mimetype) ||
				!this.extensiones.has(extension)
			) {
				throw new BadRequestException(
					`Tipo de archivo no permitido: ${archivo.originalname}`,
				);
			}

			if (!archivo.buffer || archivo.size === 0) {
				throw new BadRequestException("Archivo vacío o inválido.");
			}

			if (archivo.size > this.maxFileSize) {
				throw new BadRequestException(
					"Cada archivo debe pesar máximo 10 MB.",
				);
			}

			if (Buffer.byteLength(archivo.originalname, "utf8") > 255) {
				throw new BadRequestException(
					"El nombre del archivo es demasiado largo.",
				);
			}
		}
	}

	private validarYNormalizar(riesgo: RiesgoMediatico) {
		riesgo.titulo = riesgo.titulo?.trim();
		riesgo.fuente = riesgo.fuente?.trim();
		riesgo.link = riesgo.link?.trim();

		if (!riesgo.titulo || !riesgo.fuente || !riesgo.fecha || !riesgo.link) {
			throw new BadRequestException(
				"Título, fuente, fecha y link son obligatorios.",
			);
		}

		if (riesgo.tipo === "mediatico") {
			if (!riesgo.estatus) {
				throw new BadRequestException(
					"El estatus es obligatorio para riesgos mediáticos.",
				);
			}

			riesgo.descripcion = null;
		} else if (riesgo.tipo === "noticia") {
			if (!riesgo.descripcion?.trim()) {
				throw new BadRequestException(
					"La descripción de la noticia es obligatoria.",
				);
			}

			riesgo.descripcion = riesgo.descripcion.trim();

			riesgo.estatus = null;
			riesgo.clasificacion = null;
			riesgo.nivelRiesgo = null;
			riesgo.tendencia = false;
		} else {
			throw new BadRequestException("Tipo de registro inválido.");
		}
	}

	private crearMedia(
		archivo: Express.Multer.File,
		riesgoId: number,
		userId: number,
	): AdrMedia {
		const nombre = basename(
			this.normalizarNombreArchivo(archivo.originalname).replace(/\\/g, "/"),
		);

		return this.mediaRepository.create({
			riesgoId,
			nombreArchivo: nombre,
			extension: extname(nombre).toLowerCase(),
			mimeType: archivo.mimetype,
			sizeBytes: archivo.size,
			archivo: archivo.buffer,
			uploadedBy: userId,
		});
	}

	async create(
		dto: CreateRiesgoMediaticoDto,
		userId: number,
		archivos: Express.Multer.File[] = [],
	): Promise<RiesgoMediatico> {
		this.validarArchivos(archivos);

		const riesgo = this.riesgoRepository.create({
			tipo: dto.tipo,
			titulo: dto.titulo,
			fuente: dto.fuente,
			fecha: dto.fecha,
			link: dto.link,
			estatus: dto.estatus ?? null,
			clasificacion: dto.clasificacion ?? null,
			nivelRiesgo: dto.nivelRiesgo ?? null,
			tendencia: dto.tendencia ?? false,
			descripcion: dto.descripcion ?? null,
			createdBy: userId,
		});

		this.validarYNormalizar(riesgo);

		if (riesgo.tipo === "noticia" && archivos.length) {
			throw new BadRequestException(
				"Las noticias de sitios oficiales no admiten adjuntos.",
			);
		}

		const uuid = await this.dataSource.transaction(async (manager) => {
			const saved = await manager.save(RiesgoMediatico, riesgo);

			if (archivos.length) {
				const media = archivos.map((archivo) =>
					this.crearMedia(archivo, saved.id, userId),
				);

				await manager.save(AdrMedia, media);
			}

			return saved.uuid;
		});

		return this.findOne(uuid);
	}

	async findAll(filters: FindRiesgosDto) {
		const skip = filters.skip ?? 0;
		const take = filters.take ?? 10;

		const query = this.riesgoRepository
			.createQueryBuilder("riesgo")
			.leftJoinAndSelect("riesgo.archivos", "archivos");

		if (filters.busqueda) {
			query.andWhere(
				"(riesgo.titulo ILIKE :search OR riesgo.fuente ILIKE :search)",
				{ search: `%${filters.busqueda}%` },
			);
		}

		if (filters.tipo) {
			query.andWhere("riesgo.tipo = :tipo", {
				tipo: filters.tipo,
			});
		}

		if (filters.fecha) {
			query.andWhere("riesgo.fecha = :fecha", {
				fecha: filters.fecha,
			});
		}

		if (filters.estatus) {
			query.andWhere("riesgo.estatus = :estatus", {
				estatus: filters.estatus,
			});
		}

		if (filters.nivelRiesgo) {
			query.andWhere("riesgo.nivelRiesgo = :nivelRiesgo", {
				nivelRiesgo: filters.nivelRiesgo,
			});
		}

		const [data, total] = await query
			.orderBy("riesgo.fecha", "DESC")
			.addOrderBy("riesgo.id", "DESC")
			.skip(skip)
			.take(take)
			.getManyAndCount();

		return {
			total,
			data,
			skip,
			take,
		};
	}

	async findOne(uuid: string): Promise<RiesgoMediatico> {
		const riesgo = await this.riesgoRepository.findOne({
			where: { uuid },
			relations: { archivos: true },
		});

		if (!riesgo) {
			throw new NotFoundException("Riesgo mediático no encontrado.");
		}

		return riesgo;
	}

	async update(
		uuid: string,
		dto: UpdateRiesgoMediaticoDto,
		userId: number,
		archivos: Express.Multer.File[] = [],
	): Promise<RiesgoMediatico> {
		this.validarArchivos(archivos);

		await this.dataSource.transaction(async (manager) => {
			const riesgo = await manager.findOne(RiesgoMediatico, {
				where: { uuid },
			});

			if (!riesgo) {
				throw new NotFoundException("Riesgo mediático no encontrado.");
			}

			if (dto.tipo !== undefined) riesgo.tipo = dto.tipo;
			if (dto.titulo !== undefined) riesgo.titulo = dto.titulo;
			if (dto.fuente !== undefined) riesgo.fuente = dto.fuente;
			if (dto.fecha !== undefined) riesgo.fecha = dto.fecha;
			if (dto.link !== undefined) riesgo.link = dto.link;

			if (dto.estatus !== undefined) {
				riesgo.estatus = dto.estatus;
			}

			if (dto.clasificacion !== undefined) {
				riesgo.clasificacion = dto.clasificacion;
			}

			if (dto.nivelRiesgo !== undefined) {
				riesgo.nivelRiesgo = dto.nivelRiesgo;
			}

			if (dto.tendencia !== undefined) {
				riesgo.tendencia = dto.tendencia;
			}

			if (dto.descripcion !== undefined) {
				riesgo.descripcion = dto.descripcion;
			}

			this.validarYNormalizar(riesgo);

			if (riesgo.tipo === "noticia" && archivos.length) {
				throw new BadRequestException(
					"Las noticias de sitios oficiales no admiten adjuntos.",
				);
			}

			riesgo.updatedBy = userId;

			await manager.save(RiesgoMediatico, riesgo);

			// Si hay archivos nuevos, sustituir los anteriores.
			// También permite quitarlos sin subir nuevos.
			// Al cambiar a noticia, se eliminan lógicamente.
			const reemplazar =
				archivos.length > 0 ||
				dto.limpiarArchivos === true ||
				riesgo.tipo === "noticia";

			if (reemplazar) {
				await manager.update(
					AdrMedia,
					{ riesgoId: riesgo.id, deletedAt: IsNull() },
					{ deletedBy: userId },
				);

				await manager.softDelete(AdrMedia, {
					riesgoId: riesgo.id,
					deletedAt: IsNull(),
				});

				if (archivos.length) {
					const media = archivos.map((archivo) =>
						this.crearMedia(archivo, riesgo.id, userId),
					);

					await manager.save(AdrMedia, media);
				}
			}
		});

		return this.findOne(uuid);
	}

	async remove(uuid: string, userId: number): Promise<void> {
		await this.dataSource.transaction(async (manager) => {
			const riesgo = await manager.findOne(RiesgoMediatico, {
				where: { uuid },
			});

			if (!riesgo) {
				throw new NotFoundException("Riesgo mediático no encontrado.");
			}

			// Borrado lógico de todos los archivos asociados.
			await manager.update(
				AdrMedia,
				{ riesgoId: riesgo.id, deletedAt: IsNull() },
				{ deletedBy: userId },
			);

			await manager.softDelete(AdrMedia, {
				riesgoId: riesgo.id,
				deletedAt: IsNull(),
			});

			// Borrado lógico del registro principal.
			await manager.update(
				RiesgoMediatico,
				{ id: riesgo.id },
				{ deletedBy: userId },
			);

			await manager.softDelete(RiesgoMediatico, { id: riesgo.id });
		});
	}

	async getMedia(uuid: string, mediaId: number): Promise<AdrMedia> {
		const riesgo = await this.findOne(uuid);

		const media = await this.mediaRepository
			.createQueryBuilder("media")
			.addSelect("media.archivo")
			.where("media.id = :mediaId", { mediaId })
			.andWhere("media.riesgoId = :riesgoId", {
				riesgoId: riesgo.id,
			})
			.getOne();

		if (!media) {
			throw new NotFoundException("Archivo no encontrado.");
		}

		return media;
	}

	async removeMedia(
		uuid: string,
		mediaId: number,
		userId: number,
	): Promise<void> {
		const riesgo = await this.findOne(uuid);

		await this.dataSource.transaction(async (manager) => {
			const media = await manager.findOne(AdrMedia, {
				where: {
					id: mediaId,
					riesgoId: riesgo.id,
				},
			});

			if (!media) {
				throw new NotFoundException("Archivo no encontrado.");
			}

			await manager.update(
				AdrMedia,
				{ id: media.id },
				{ deletedBy: userId },
			);

			await manager.softDelete(AdrMedia, { id: media.id });
		});
	}

	private normalizarNombreArchivo(nombreOriginal: string): string {
		// Recuperar caracteres UTF-8 interpretados como Latin-1.
		const convertido = Buffer.from(nombreOriginal, "latin1").toString("utf8");

		// Si ya estaba correctamente decodificado,
		// evitar introducir caracteres inválidos.
		return convertido.includes("\uFFFD") ? nombreOriginal : convertido;
	}
}
