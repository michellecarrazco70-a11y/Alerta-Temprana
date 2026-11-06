import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { AlertaTemprana } from "../entities/usr/alerta-temprana.entity";

import { CreateAlertaTempranaDto } from "./dtos/create-alerta-temprana.dto";
import { UpdateAlertaTempranaDto } from "./dtos/update-alerta-temprana.dto";
import { FindAlertasTempranasDto } from "./dtos/find-alerta-temprana.dto";
import { AlertaTempranaEliminada } from "../entities/usr/alerta-temprana-eliminada.entity";

@Injectable()
export class AlertaTempranaService {
	constructor(
		@InjectRepository(AlertaTemprana)
		private readonly alertaRepository: Repository<AlertaTemprana>,

		private readonly dataSource: DataSource,
	) { }

	private validarYNormalizar(alerta: AlertaTemprana) {
		alerta.patologia = alerta.patologia?.trim();
		alerta.municipio = alerta.municipio?.trim();
		alerta.localidad = alerta.localidad?.trim() ? alerta.localidad.trim() : null;

		if (!alerta.patologia || !alerta.fecha || !alerta.municipio) {
			throw new BadRequestException(
				"Patología, fecha y municipio son obligatorios.",
			);
		}

		if (alerta.numeroCasos === undefined || alerta.numeroCasos === null || alerta.numeroCasos < 0) {
			throw new BadRequestException(
				"El número de casos debe ser un entero mayor o igual a 0.",
			);
		}
	}

	async create(
		dto: CreateAlertaTempranaDto,
		userId: number,
	): Promise<AlertaTemprana> {
		const alerta = this.alertaRepository.create({
			patologia: dto.patologia,
			fecha: dto.fecha,
			municipio: dto.municipio,
			localidad: dto.localidad ?? null,
			numeroCasos: dto.numeroCasos,
			createdBy: userId,
		});

		this.validarYNormalizar(alerta);

		const uuid = await this.dataSource.transaction(async (manager) => {
			const saved = await manager.save(AlertaTemprana, alerta);
			return saved.uuid;
		});

		return this.findOne(uuid);
	}

	async findAll(filters: FindAlertasTempranasDto) {
		const skip = filters.skip ?? 0;
		const take = filters.take ?? 10;

		const query = this.alertaRepository
			.createQueryBuilder("alerta");

		if (filters.busqueda) {
			query.andWhere(
				"(alerta.patologia ILIKE :search OR alerta.municipio ILIKE :search OR alerta.localidad ILIKE :search)",
				{ search: `%${filters.busqueda}%` },
			);
		}

		if (filters.patologia) {
			query.andWhere("alerta.patologia ILIKE :patologia", {
				patologia: `%${filters.patologia}%`,
			});
		}

		if (filters.fecha) {
			query.andWhere("alerta.fecha = :fecha", {
				fecha: filters.fecha,
			});
		}

		if (filters.municipio) {
			query.andWhere("alerta.municipio ILIKE :municipio", {
				municipio: `%${filters.municipio}%`,
			});
		}

		if (filters.localidad) {
			query.andWhere("alerta.localidad ILIKE :localidad", {
				localidad: `%${filters.localidad}%`,
			});
		}

		const [data, total] = await query
			.orderBy("alerta.fecha", "DESC")
			.addOrderBy("alerta.id", "DESC")
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

	async findOne(uuid: string): Promise<AlertaTemprana> {
		const alerta = await this.alertaRepository.findOne({
			where: { uuid },
		});

		if (!alerta) {
			throw new NotFoundException("Alerta temprana no encontrada.");
		}

		return alerta;
	}

	async update(
		uuid: string,
		dto: UpdateAlertaTempranaDto,
		userId: number,
	): Promise<AlertaTemprana> {
		await this.dataSource.transaction(async (manager) => {
			const alerta = await manager.findOne(AlertaTemprana, {
				where: { uuid },
			});

			if (!alerta) {
				throw new NotFoundException("Alerta temprana no encontrada.");
			}

			if (dto.patologia !== undefined) alerta.patologia = dto.patologia;
			if (dto.fecha !== undefined) alerta.fecha = dto.fecha;
			if (dto.municipio !== undefined) alerta.municipio = dto.municipio;
			if (dto.localidad !== undefined) alerta.localidad = dto.localidad;
			if (dto.numeroCasos !== undefined) alerta.numeroCasos = dto.numeroCasos;

			this.validarYNormalizar(alerta);

			alerta.updatedBy = userId;

			await manager.save(AlertaTemprana, alerta);
		});

		return this.findOne(uuid);
	}

	async remove(uuid: string, userId: number): Promise<void> {
		await this.dataSource.transaction(async (manager) => {
			const alerta = await manager.findOne(AlertaTemprana, {
				where: { uuid },
			});

			if (!alerta) {
				throw new NotFoundException("Alerta temprana no encontrada.");
			}

			// Guarda los datos en la bitácora de respaldo
			const copiaEliminada = manager.create(AlertaTempranaEliminada, {
				uuidOriginal: alerta.uuid,
				patologia: alerta.patologia,
				fecha: alerta.fecha,
				municipio: alerta.municipio,
				localidad: alerta.localidad,
				numeroCasos: alerta.numeroCasos,
				createdByOriginal: alerta.createdBy,
				createdAt: alerta.createdAt ?? new Date(),
				deletedBy: userId,
			});
			await manager.save(AlertaTempranaEliminada, copiaEliminada);
		

			// Actualiza deletedBy y realiza softDelete en la tabla principal
			await manager.update(
				AlertaTemprana,
				{ id: alerta.id },
				{ deletedBy: userId },
			);

			await manager.softDelete(AlertaTemprana, { id: alerta.id });
		});
	}
}