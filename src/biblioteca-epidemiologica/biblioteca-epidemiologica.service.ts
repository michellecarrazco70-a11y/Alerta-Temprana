import { 
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException
} from "@nestjs/common";


import { InjectRepository } from "@nestjs/typeorm";
import { basename, extname } from "path";

import { InformeEpidemiologico } from "src/entities/usr/adr-informe-epidemiologico.entity";
import { SemanaEpidemiologica } from "src/entities/usr/adr-semana-epidemiologica.entity";

import { DataSource, EntityManager, In, IsNull, Not, Repository } from "typeorm";
import { CreateBibliotecaEpidemiologicaDto, InformeDto } from "./dtos/create-biblioteca-epidemiologica.dto";
import { UpdateBibliotecaEpidemiologicaDto } from "./dtos/update-biblioteca-epidemiologica.dto";
import { FindBibliotecaDto } from "./dtos/find-biblioteca-epidemiologica.dto";


@Injectable()
export class BibliotecaEpidemiologicaService {
    constructor(
        @InjectRepository(SemanaEpidemiologica)
        private readonly semanaRepository: Repository<SemanaEpidemiologica>,

        @InjectRepository(InformeEpidemiologico)
        private readonly informeRepository: Repository<InformeEpidemiologico>,

        private readonly dataSource: DataSource,
    ) {}

    private readonly maxFileSize = 10 * 1024 * 1024; // 10 MB
    private readonly maxArchivos = 5; // numero máximo de archivos permitidos en la carga

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

    // Validaciones ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    private validarArchivo(archivos: Express.Multer.File[]){
        if (archivos.length > this.maxArchivos) {
            throw new BadRequestException(`Se permite un máximo de ${this.maxArchivos} archivos por carga.`);// Validación de cantidad de archivos
        }

        for (const archivo of archivos){
            const extension = extname(archivo.originalname).toLowerCase();

            if (
                !this.mimeTypes.has(archivo.mimetype) ||
                !this.extensiones.has(extension)
            ) {
                throw new BadRequestException(`Tipo de archivo no permitido: ${archivo.originalname}`);
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

    private validarFechas(inicio: string, fin: string){
        //formato de fecha YYYY-MM-DD
        if(fin< inicio){
            throw new BadRequestException("La fecha de fin no puede ser anterior a la fecha de inicio.");
        }

    }
    // esto es para validar que no se repitan patologías en los informes y que no se repitan archivos en la carga
    private validarInformes(
        informes: InformeDto[],
        archivos: Express.Multer.File[],
        conservables: Set<string>,
    ){
        const patologias = new Set<string>();
        const usados = new Set<number>();

        
        for (const informe of informes){
            // Validar que la patología no esté repetida en una misma carga de informes
            if(patologias.has(informe.patologia)){
                throw new BadRequestException(
                    `La patología "${informe.patologia}" está repetida.`,
                );
            }
            patologias.add(informe.patologia);

            // Validar que el archivo esté asociado a la patología.
            if(informe.archivoIndex === null || informe.archivoIndex === undefined){
                if(!conservables.has(informe.patologia)){
                    throw new BadRequestException(
                        `Falta el archivo para la patología "${informe.patologia}".`,
                    );
                }
                continue; // Si es conservable, no necesitamos validar el archivo
            }

            if(
                informe.archivoIndex >= archivos.length ||
                usados.has(informe.archivoIndex)

            ){
                throw new BadRequestException(
                    `El archivo para la patología "${informe.patologia}" no es válido.`,
                );
            }
            usados.add(informe.archivoIndex);
        }
    }

    //Utilidades ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    private datosArchivo(archivo: Express.Multer.File){
        const nombre = basename(
            this.normalizarNombreArchivo(archivo.originalname).replace(/\\/g, "/"),
        );
        return {
            nombreArchivo: nombre,
            extension: extname(nombre).toLowerCase(),
            mimeType: archivo.mimetype,
            sizeBytes: archivo.size,
            archivo: archivo.buffer,
        };
    }

    private aMetadata(informe: InformeEpidemiologico){
        return {
            id: informe.id,
            bibliotecaId: informe.semanaId,
            patologia: informe.patologia,
            nombreArchivo: informe.nombreArchivo,
            extension: informe.extension,
            mimeType: informe.mimeType,
            sizeBytes: informe.sizeBytes,
            uploadedBy: informe.createdBy,
            createdAt: informe.createdAt,
        };
    }

    private async guardarInformes(
        manager: EntityManager,
        semanaId: number,
        informes: InformeDto[],
        archivos: Express.Multer.File[],
        userId: number,
    ){

        for(const informe of informes){
            //
            if(informe.archivoIndex === null || informe.archivoIndex === undefined){
                continue;
            }
            
            const datos = this.datosArchivo(archivos[informe.archivoIndex]);
            const existente = await manager.findOne(InformeEpidemiologico,{
                where: {
                    semanaId,
                    patologia: informe.patologia,
                },
                withDeleted: true,
            });

            if(existente){
                await manager.update(
                    InformeEpidemiologico,
                    {id: existente.id},
                    {...datos, updatedBy: userId, deletedBy: null},
                );
                if(existente.deletedAt){
                    await manager.restore(InformeEpidemiologico, {id: existente.id});
                }

            }else{
                await manager.save(
                    InformeEpidemiologico,
                    manager.create(InformeEpidemiologico,{
                        semanaId,
                        patologia: informe.patologia,
                        ...datos,
                        createdBy: userId, 
                    }),
                );
            }

        }
    }

    private normalizarNombreArchivo(nombreOriginal: string): string {
        //recupera caracteres UFT-8 interpretados como Latin-1.
        const convertido = Buffer.from(nombreOriginal, "latin1").toString("utf8");
        
        return convertido.includes("\uFFFD") ? nombreOriginal : convertido;
    }

    //Esta Seccion hará como el catalogo de las PATOLOGIAS
    //registradas que se mostraran en los desplegable de patologia.
    //basicamente: catalogo = nombre de las patologias registradas.

    //Clave de comparacion: no cento, no mayuscula, no espacios simples.

    private clavePatologia(nombre: string): string {
        return nombre
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }

    private async nombresPatologias(manager?: EntityManager): Promise<string[]> {
        const rows = await (manager ?? this.dataSource.manager)
        .createQueryBuilder(InformeEpidemiologico, "informe")
        .select("informe.patologia", "patologia")
        .groupBy("informe.patologia")
        .orderBy("informe.patologia", "ASC")
        .getRawMany<{patologia: string}>();

        return rows.map((row)=> row.patologia);
    }

    async getPatologias(): Promise<string[]> {
		return this.nombresPatologias();
	}

    // Si la patología ya existe se usa
	// el nombre ya registrado,. si no, el tecleado pasa a ser el estandar.
	private async estandarizarPatologias(
		manager: EntityManager,
		informes: InformeDto[],
	) {
		const catalogo = new Map<string, string>();
 
		for (const nombre of await this.nombresPatologias(manager)) {
			catalogo.set(this.clavePatologia(nombre), nombre);
		}
 
		for (const informe of informes) {
			const limpio = informe.patologia.replace(/\s+/g, " ").trim();
			const clave = this.clavePatologia(limpio);
			const estandar = catalogo.get(clave);
 
			if (estandar) {
				informe.patologia = estandar;
			} else {
				catalogo.set(clave, limpio);
				informe.patologia = limpio;
			}
		}
    }

    //Crear +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    async create(
        dto: CreateBibliotecaEpidemiologicaDto,
        userId: number,
		archivos: Express.Multer.File[] = [],        
    ){
        this.validarArchivo(archivos);
        this.validarFechas(dto.inicioSemana, dto.finSemana);

        const uuid = await this.dataSource.transaction(async(manager)=>{
            await this.estandarizarPatologias(manager, dto.informes);
            this.validarInformes(dto.informes, archivos, new Set());

            const previa = await manager.findOne(SemanaEpidemiologica, {
                where: {
                    numeroSemana: dto.numeroSemana,
                    fechaInicio: dto.inicioSemana,
                    fechaFin: dto.finSemana,
                },
                withDeleted: true,
            });

            let semana: SemanaEpidemiologica;

            if(previa){
                if(!previa.deletedAt){
                    throw new ConflictException(
                        "Ya existe un registro para esa semana epidemiologica."
                    );
                }

                //Misma semana eliminada amtes: se restaura (UNIQUE de la tabla)
                await manager.restore(SemanaEpidemiologica, {id: previa.id});
                await manager.update(
                    SemanaEpidemiologica,
                    {id: previa.id},
                    {deletedBy: null, updatedBy: userId},

                );

                semana = previa;

            }else{
                semana = await manager.save(
                    SemanaEpidemiologica,
                    manager.create(SemanaEpidemiologica, {
                        numeroSemana: dto.numeroSemana,
                        fechaInicio: dto.inicioSemana,
                        fechaFin: dto.finSemana,
                        createdBy: userId,
                    }),
                );
            }

            await this.guardarInformes(
                manager,
                semana.id,
                dto.informes,
                archivos,
                userId,
            );

            return semana.uuid;

        });
        return this.findOne(uuid);
    }

    //Consultar +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    //una fila por informe.
    async findAll(filters: FindBibliotecaDto) {
		const skip = filters.skip ?? 0;
		const take = filters.take ?? 10;
 
		const query = this.informeRepository
			.createQueryBuilder("informe")
			.innerJoinAndSelect("informe.semana", "semana");
 
		if (filters.patologia) {
			query.andWhere("informe.patologia = :patologia", {
				patologia: filters.patologia,
			});
		}
 
		if (filters.numeroSemana) {
			query.andWhere("semana.numeroSemana = :numeroSemana", {
				numeroSemana: filters.numeroSemana,
			});
		}
 
		const [rows, total] = await query
			.orderBy("semana.fechaInicio", "DESC")
			.addOrderBy("semana.numeroSemana", "DESC")
			.addOrderBy("informe.id", "ASC")
			.skip(skip)
			.take(take)
			.getManyAndCount();
 
		const data = rows.map((informe) => ({
			id: informe.id, // id del informe
			uuid: informe.semana.uuid, // uuid de la semana (se usa en las rutas)
			semana: informe.semana.numeroSemana,
			inicio: informe.semana.fechaInicio,
			fin: informe.semana.fechaFin,
			patologia: informe.patologia,
			archivoNombre: informe.nombreArchivo,
			archivos: [this.aMetadata(informe)],
		}));
 
		return { total, data, skip, take };
	}

    //Semana con todos sus imformes

    async findOne(uuid: string) {
		const semana = await this.semanaRepository.findOne({
			where: { uuid },
			relations: { informes: true },
			order: { informes: { id: "ASC" } },
		});
 
		if (!semana) {
			throw new NotFoundException("Semana epidemiológica no encontrada.");
		}
 
		return {
			id: semana.id,
			uuid: semana.uuid,
			numeroSemana: semana.numeroSemana,
			inicioSemana: semana.fechaInicio,
			finSemana: semana.fechaFin,
			informes: semana.informes.map((informe) => this.aMetadata(informe)),
		};
	}

    async getInforme(
		uuid: string,
		informeId: number,
	): Promise<InformeEpidemiologico> {
		const semana = await this.semanaRepository.findOne({ where: { uuid } });
 
		if (!semana) {
			throw new NotFoundException("Semana epidemiológica no encontrada.");
		}
 
		const informe = await this.informeRepository
			.createQueryBuilder("informe")
			.addSelect("informe.archivo")
			.where("informe.id = :informeId", { informeId })
			.andWhere("informe.semanaId = :semanaId", { semanaId: semana.id })
			.getOne();
 
		if (!informe) {
			throw new NotFoundException("Informe no encontrado.");
		}
 
		return informe;
	}

    //Edicion +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    
    async update(
		uuid: string,
		dto: UpdateBibliotecaEpidemiologicaDto,
		userId: number,
		archivos: Express.Multer.File[] = [],
	) {
		this.validarArchivo(archivos);
 
		await this.dataSource.transaction(async (manager) => {
			const semana = await manager.findOne(SemanaEpidemiologica, {
				where: { uuid },
			});
 
			if (!semana) {
				throw new NotFoundException("Semana epidemiológica no encontrada.");
			}
 
			const numero = dto.numeroSemana ?? semana.numeroSemana;
			const inicio = dto.inicioSemana ?? semana.fechaInicio;
			const fin = dto.finSemana ?? semana.fechaFin;
 
			this.validarFechas(inicio, fin);
 
			const cambioClave =
				numero !== semana.numeroSemana ||
				inicio !== semana.fechaInicio ||
				fin !== semana.fechaFin;
 
			if (cambioClave) {
				const duplicada = await manager.findOne(SemanaEpidemiologica, {
					where: {
						numeroSemana: numero,
						fechaInicio: inicio,
						fechaFin: fin,
						id: Not(semana.id),
					},
					withDeleted: true,
				});
 
				if (duplicada) {
					throw new ConflictException(
						"Ya existe un registro para esa semana epidemiológica.",
					);
				}
			}
 
			semana.numeroSemana = numero;
			semana.fechaInicio = inicio;
			semana.fechaFin = fin;
			semana.updatedBy = userId;
 
			await manager.save(SemanaEpidemiologica, semana);
 
			if (!dto.informes) return;
 
			await this.estandarizarPatologias(manager, dto.informes);
 
			const existentes = await manager.find(InformeEpidemiologico, {
				where: { semanaId: semana.id },
			});
 
			this.validarInformes(
				dto.informes,
				archivos,
				new Set(existentes.map((e) => e.patologia)),
			);
 
			await this.guardarInformes(
				manager,
				semana.id,
				dto.informes,
				archivos,
				userId,
			);
 
			// Los informes que ya no vienen en la lista se eliminan.
			const vigentes = new Set<string>(dto.informes.map((i) => i.patologia));
			const sobrantes = existentes
				.filter((e) => !vigentes.has(e.patologia))
				.map((e) => e.id);
 
			if (sobrantes.length) {
				await manager.update(
					InformeEpidemiologico,
					{ id: In(sobrantes) },
					{ deletedBy: userId },
				);
 
				await manager.softDelete(InformeEpidemiologico, { id: In(sobrantes) });
			}
		});
 
		return this.findOne(uuid);
	}

    // Borrado logico +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    
    async remove(uuid: string, userId: number): Promise<void> {
		await this.dataSource.transaction(async (manager) => {
			const semana = await manager.findOne(SemanaEpidemiologica, {
				where: { uuid },
			});
 
			if (!semana) {
				throw new NotFoundException("Semana epidemiológica no encontrada.");
			}
 
			await manager.update(
				InformeEpidemiologico,
				{ semanaId: semana.id, deletedAt: IsNull() },
				{ deletedBy: userId },
			);
 
			await manager.softDelete(InformeEpidemiologico, {
				semanaId: semana.id,
				deletedAt: IsNull(),
			});
 
			await manager.update(
				SemanaEpidemiologica,
				{ id: semana.id },
				{ deletedBy: userId },
			);
 
			await manager.softDelete(SemanaEpidemiologica, { id: semana.id });
		});
	}
 
	async removeInforme(
		uuid: string,
		informeId: number,
		userId: number,
	): Promise<void> {
		await this.dataSource.transaction(async (manager) => {
			const semana = await manager.findOne(SemanaEpidemiologica, {
				where: { uuid },
			});
 
			if (!semana) {
				throw new NotFoundException("Semana epidemiológica no encontrada.");
			}
 
			const informe = await manager.findOne(InformeEpidemiologico, {
				where: { id: informeId, semanaId: semana.id },
			});
 
			if (!informe) {
				throw new NotFoundException("Informe no encontrado.");
			}
 
			await manager.update(
				InformeEpidemiologico,
				{ id: informe.id },
				{ deletedBy: userId },
			);
 
			await manager.softDelete(InformeEpidemiologico, { id: informe.id });
 
			// Si ya no quedan informes, la semana queda vacía: también se elimina.
			const restantes = await manager.count(InformeEpidemiologico, {
				where: { semanaId: semana.id },
			});
 
			if (restantes === 0) {
				await manager.update(
					SemanaEpidemiologica,
					{ id: semana.id },
					{ deletedBy: userId },
				);
 
				await manager.softDelete(SemanaEpidemiologica, { id: semana.id });
			}
		});
	}
}
