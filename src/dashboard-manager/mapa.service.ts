import { HttpException, HttpStatus, Inject, Injectable, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import path, { join } from 'path';
import * as nodeOs from 'os';
import * as nodePath from 'path';
import {    Dashboard, 
            Log, 
            User, 
            dashboard_user, 
            organizaciones,
            RoleUser,
            proyectos,
            userProyects,
            Avances,
            Features,
            MunicipioImage,
            FeaturesRevise,
            FeaturesJson,
            Cobertura
        } from 'src/entities';
import { DataSource, IsNull, Not, Raw, Repository } from 'typeorm';
import { execFile } from 'child_process';
import { randomBytes } from 'crypto';
import { createReadStream, existsSync, promises as fsp } from 'fs';   // <<— here
import { promisify } from 'util';
import { Profile } from 'src/entities/usr/profiles.entity';
import { UserProfileRedTroncal } from 'src/entities/usr/user-profile-red-troncal.entity';
import { ProfileLayerPermission } from 'src/entities/usr/profile-layer-permissions.entity';
import { Layer } from 'src/entities/usr/layers.entity';

const execFileAsync = promisify(execFile);

type GroupLabel = 'PROYECTADA' | 'REAL';

interface Overlay {
  href: string;
  north: number;
  south: number;
  east: number;
  west: number;
}

interface CoberturaEntity {
  id: number;
  rttu_id: string;
  group_label: GroupLabel;
  boundbox: { north: number; south: number; east: number; west: number };
  png: Buffer;
  activo: boolean;
  created_at: Date;
}

type Dir = 'to' | 'from';
type Enlace = { peer: string; cluster?: string; estatus?: string; direction: Dir };
type TorreOp = { kind: 'add'|'update'|'delete'; peerClave: string; cluster?: string; enlace: Enlace };

export interface CoberturaDTO {
  id: string;  // <- string, not number
  rttu_id: string;
  group_label: GroupLabel;
  coordinates: [number, number][];
  created_at: Date;
  imageDataUrl: string;
}

/** Minimal per-key in-process lock (serializes work per RTTU+group). */
class KeyLock {
  private chains = new Map<string, Promise<unknown>>();
  async run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.chains.get(key) || Promise.resolve();
    let resolveCurrent!: (v?: unknown) => void;
    let rejectCurrent!: (e: unknown) => void;
    const current = new Promise((res, rej) => { resolveCurrent = res; rejectCurrent = rej; });

    // Chain: prev → current; errors should not break the chain
    this.chains.set(key, prev.then(() => current).catch(() => current));

    // Wait previous
    await prev;

    try {
      const result = await fn();
      resolveCurrent();
      if (this.chains.get(key) === current) this.chains.delete(key);
      return result;
    } catch (err) {
      rejectCurrent(err);
      if (this.chains.get(key) === current) this.chains.delete(key);
      throw err;
    }
  }
}

@Injectable()
export class MapaService {

    constructor(
        @InjectRepository(RoleUser)
        private roleUserRepository: Repository<RoleUser>,
        @InjectRepository(Log)
        private logger: Repository<Log>,
        @InjectRepository(User)
        private userRpository: Repository<User>,
        @InjectRepository(Features)
        private featuresRepository: Repository<Features>,
        @InjectRepository(MunicipioImage)
        private municipioHistoryRepository: Repository<MunicipioImage>,
        @InjectRepository(FeaturesRevise)
        private featuresReviseRepository: Repository<FeaturesRevise>,
        @InjectRepository(FeaturesJson)
        private geoJsonRepository: Repository<FeaturesJson>,
        @InjectRepository(Cobertura)
        private coberturasRepo: Repository<Cobertura>,
        @InjectRepository(UserProfileRedTroncal)
        private readonly userProfilesRepo: Repository<UserProfileRedTroncal>,
        @InjectRepository(Profile)
        private readonly profilesRepo: Repository<Profile>,
        @InjectRepository(ProfileLayerPermission)
        private readonly profileLayerPermRepo: Repository<ProfileLayerPermission>,
        @InjectRepository(Layer)
        private readonly layersRepo: Repository<Layer>,
        private ds: DataSource
    ){}

    async log(action: string, message: string, stack: string){
        const newLog = this.logger.create({
            action: action,
            context: 'Mapa',
            message: message,
            stack: stack
        })
        await this.logger.save(newLog)
    }

    private invert(d: Dir): Dir { return d === 'to' ? 'from' : 'to'; }

    private getClave(f: any): string | undefined {
        return f?.properties?.['clave unica'];
    }

    private setCoords(f: any, payload: any) {
        if (payload?.geometry?.coordinates) {
        f.geometry = payload.geometry; // GeoJSON canonical
        } else if (Array.isArray(payload?.cords)) {
        // legacy support
        if (!f.geometry) f.geometry = { type: 'Point', coordinates: [0,0] };
        f.geometry.type = 'Point';
        f.geometry.coordinates = payload.cords;
        }
    }

    private shallowMergeProps(f: any, partial: Record<string, any>) {
        f.properties = { ...(f.properties ?? {}), ...partial };
    }

    private enlaceKey(e: Enlace): string {
        const norm = (s: string | undefined) => (s ?? '').trim().toUpperCase();
        return `${norm(e.peer)}|${norm(e.cluster)}`;
    }

    private findEnlaceIdx(arr: Enlace[], target: Enlace) {
        const key = this.enlaceKey(target);
        return (arr || []).findIndex(e => this.enlaceKey(e) === key);
    }

    private upsertEnlace(arr: Enlace[], nuevo: Enlace) {
        if (!Array.isArray(arr)) return;

        const key = this.enlaceKey(nuevo);
        const idx = arr.findIndex(e => this.enlaceKey(e) === key);

        if (idx === -1) {
            arr.push({ ...nuevo });
        } else {
            arr[idx] = { ...arr[idx], ...nuevo };
        }
    }

    private deleteEnlace(arr: Enlace[], target: Enlace) {
        if (!Array.isArray(arr)) return;

        const key = this.enlaceKey(target);
        const idx = arr.findIndex(e => this.enlaceKey(e) === key);
        if (idx !== -1) {
            arr.splice(idx, 1);
        }
    }

    private ensureArrays(f: any) {
        f.properties = f.properties ?? {};
        if (!Array.isArray(f.properties.enlaces)) {
            f.properties.enlaces = [];
        }
    }

    async checkAccess(user_id: number, uid: string){
        const checkRes = await this.roleUserRepository.find({where: {userId: user_id, roleId: 4}})

        const access = checkRes.length > 0

        if(access) this.log('ACCESO', `El ususario ${await this.getUserNameById(uid)} accedio al Mapa de la Red Troncal`,``)
        
        return access; 
    }

    async getUserNameById(uid: string){
        const usr = await this.userRpository.findOne({where:{ uuid: uid}})

        if (!usr) {
            // Handle the case where the user is not found
            throw new Error('User not found');
        }
    
        // Concatenate the name fields
        const completeName = `${usr.name} ${usr.firstName} ${usr.secondName}`.trim();
        return completeName;
    }

    async isAdminOrMapUser(id_user: number){
        const isAdmin = await this.isAdmin(id_user)

        if(isAdmin) return true

        const roleUserMapRelation = this.roleUserRepository.findOne({where: {userId: id_user, roleId: 7}})
    }

    async getAllFeatures(){
        const fetchFeatures = await this.featuresRepository.find({where: {activo: true}})

        if(!fetchFeatures) return []

        return fetchFeatures
    }

    async getAllPerfiles(id_user: number) {
        const isAdmin = await this.isAdmin(id_user);

        if (!isAdmin) {
            throw new HttpException('Error', HttpStatus.CONFLICT);
        }

        const profiles = await this.profilesRepo.find({
            where: { is_active: true },
            order: { code: 'ASC' },
        });

        const allProfiles = [];

        for (const profile of profiles) {
            const rows = await this.layersRepo
            .createQueryBuilder('l')
            .leftJoin(
                ProfileLayerPermission,
                'plp',
                'plp.layer_id = l.id AND plp.profile_id = :profileId',
                { profileId: profile.id },
            )
            .where('l.is_active = true')
            .orderBy('l.key', 'ASC')
            .select([
                'l.id AS layer_id',
                'l.key AS key',
                'l.label AS label',
                'l.is_active AS is_active',
                'COALESCE(plp.can_read, false) AS can_read',
                'COALESCE(plp.can_write, false) AS can_write',
            ])
            .getRawMany();

            allProfiles.push({
            id: profile.id,
            code: profile.code,
            name: profile.name,
            description: profile.description,
            is_active: profile.is_active,
            created_at: profile.created_at,
            layers: rows.map((r: any) => ({
                id: String(r.layer_id),
                key: r.key,
                label: r.label,
                is_active: r.is_active,
                can_read: r.can_read,
                can_write: r.can_write,
            })),
            });
        }

        return allProfiles;
    }

    async syncRedTroncalCustomProfileForUser(params: {
        userId: number;
        userUuid: string;
        enabled: boolean;
        layers?: Array<{
            id: number;
            can_read: boolean;
            can_write: boolean;
        }>;
    }) {
        const { userId, userUuid, enabled, layers = [] } = params;

        const code = `custom_${userUuid}`;

        if (!enabled) {
            await this.userProfilesRepo.delete({
                user_id: userId as any,
            });

            return {
                enabled: false,
                profile: null,
            };
        }

        let profile = await this.profilesRepo.findOne({
            where: { code },
        });

        if (!profile) {
            profile = this.profilesRepo.create({
                code,
                name: 'Custom profile',
                description: `Custom Red Troncal profile for user ${userUuid}`,
                is_active: true,
            });

            profile = await this.profilesRepo.save(profile);
        } else {
            profile.name = 'Custom profile';
            profile.description = `Custom Red Troncal profile for user ${userUuid}`;
            profile.is_active = true;

            profile = await this.profilesRepo.save(profile);
        }

        await this.profileLayerPermRepo.delete({
            profile_id: profile.id as any,
        });

        const normalizedLayers = layers.map((layer) => ({
            layer_id: String(layer.id),
            profile_id: String(profile.id),
            can_read: !!layer.can_read || !!layer.can_write,
            can_write: !!layer.can_write,
        }));

        if (normalizedLayers.length) {
            const permissionRows = this.profileLayerPermRepo.create(normalizedLayers);
            await this.profileLayerPermRepo.save(permissionRows);
        }

        const existingLink = await this.userProfilesRepo.findOne({
            where: {
                user_id: userId as any,
            },
        });

        if (existingLink) {
            existingLink.profile_id = profile.id as any;
            await this.userProfilesRepo.save(existingLink);
        } else {
            const link = this.userProfilesRepo.create({
                user_id: userId as any,
                profile_id: profile.id as any,
            });

            await this.userProfilesRepo.save(link);
        }

        return {
            enabled: true,
            profile,
        };
    }

    async getDefaultPerfilTemplate(id_user: number) {
        const isAdmin = await this.isAdmin(id_user);

        if (!isAdmin) {
            throw new HttpException('No tiene acceso', HttpStatus.CONFLICT);
        }

        const layers = await this.layersRepo.find({
            where: { is_active: true },
            order: { key: 'ASC' },
        });

        return {
            id: null,
            code: null,
            name: 'Custom profile',
            description: 'Default Red Troncal permissions',
            is_active: true,
            layers: layers.map((layer) => ({
                id: String(layer.id),
                key: layer.key,
                label: layer.label,
                is_active: layer.is_active,
                can_read: true,
                can_write: true,
            })),
        };
    }

    async getPerfil(id_user: number | string) {
        let userId: number | undefined;

        if (typeof id_user === 'string') {
            if (/^\d+$/.test(id_user)) {
                userId = Number(id_user);
            } else {
                const user = await this.userRpository.findOne({
                    where: { uuid: id_user },
                });

                userId = user?.id;
            }
        } else {
            userId = id_user;
        }

        if (!userId) {
            return {
                user_id: id_user,
                profiles: [],
            };
        }

        const assignments = await this.userProfilesRepo.find({
            where: {
                user_id: userId as any,
            },
            relations: {
                profile: true,
            },
        });

        const profiles = [];

        for (const assignment of assignments) {
            const profile = assignment.profile;

            if (!profile?.is_active) {
                continue;
            }

            const rows = await this.layersRepo
                .createQueryBuilder('l')
                .leftJoin(
                    ProfileLayerPermission,
                    'plp',
                    'plp.layer_id = l.id AND plp.profile_id = :profileId',
                    { profileId: String(profile.id) },
                )
                .where('l.is_active = true')
                .orderBy('l.key', 'ASC')
                .select([
                    'l.id AS layer_id',
                    'l.key AS key',
                    'l.label AS label',
                    'l.is_active AS is_active',
                    'COALESCE(plp.can_read, false) AS can_read',
                    'COALESCE(plp.can_write, false) AS can_write',
                ])
                .getRawMany();

            profiles.push({
                id: profile.id,
                code: profile.code,
                name: profile.name,
                description: profile.description,
                is_active: profile.is_active,
                layers: rows.map((r: any) => ({
                    id: String(r.layer_id),
                    key: r.key,
                    label: r.label,
                    is_active: r.is_active,
                    can_read: r.can_read === true || r.can_read === 'true',
                    can_write: r.can_write === true || r.can_write === 'true',
                })),
            });
        }

        return {
            user_id: userId,
            profiles,
        };
    }

    getPlantilla(layer: string): StreamableFile {
        const fileName = `${layer}.xlsx`;

        const filePath = join(
            process.cwd(),
            'src',
            'assets',
            'red_troncal',
            'plantillas',
            fileName,
        );

        if (!existsSync(filePath)) {
            throw new HttpException(`No existe la plantilla para ${layer}`, HttpStatus.CONFLICT);
        }

        const file = createReadStream(filePath);

        return new StreamableFile(file, {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            disposition: `attachment; filename="${fileName}"`,
        });
    }

    async getFeaturesByGroup(groupName: string) {
        const fetchedFeatures = await this.geoJsonRepository
            .createQueryBuilder('f')
            .where(`f.geojson->'properties'->>'grupo' = :groupName`, { groupName })
            .andWhere(`(f.geojson->'properties'->>'activo')::boolean = true`)
            .getMany();

        return fetchedFeatures;
    }


    async getRevisedFeatures(id_user: number){
        const fetchFeatures = await this.featuresReviseRepository.find({where: {activo: true}})

        if(!fetchFeatures) return []

        return fetchFeatures
    }

    async _updateFeature(id: number, payload: any) {
        const row = await this.geoJsonRepository.findOne({ where: { id } });
    
        if (!row) throw new Error(`Feature ${id} not found`);

        const f = row.geojson ?? {};

        // coords (geometry or cords)
        this.setCoords(f, payload);

        // properties
        if (payload?.properties) {
        // if stringified, parse it
        const props = typeof payload.properties === 'string'
            ? JSON.parse(payload.properties)
            : payload.properties;
        this.shallowMergeProps(f, props);
        }

        // persist
        row.geojson = f;
        await this.geoJsonRepository.save(row);
        return { ok: true, id: row.id };
    }

    async _updateProveedores(id: number, body: { proveedores: any[] }) {
        const row = await this.geoJsonRepository.findOne({ where: { id } });
        if (!row) throw new Error(`Feature ${id} not found`);

        const f = row.geojson ?? {};
        f.properties = f.properties ?? {};
        f.properties.proveedores = Array.isArray(body?.proveedores) ? body.proveedores : [];

        row.geojson = f;
        await this.geoJsonRepository.save(row);
        return { ok: true, id: row.id, count: f.properties.proveedores.length };
    }

    async _syncTorresEnlaces(body: {
        sourceClave: string;
        newClave?: string;
        ops: TorreOp[];
    }) {
        const { sourceClave, newClave, ops = [] } = body;
        if (!sourceClave) throw new Error('sourceClave is required');

        return this.ds.transaction(async (trx) => {
            const repo = trx.getRepository(FeaturesJson);

            // 1) Load source torre
            const source = await repo.createQueryBuilder('t')
            .where(`t.geojson->'properties'->>'clave unica' = :clave`, { clave: sourceClave })
            .getOne();

            if (!source) {
            throw new Error(`Source torre ${sourceClave} not found`);
            }

            const s = source.geojson ?? {};
            s.properties = s.properties ?? {};
            this.ensureArrays(s);

            // 2) Apply clave change (if any) BEFORE mirroring so peers point to new clave
            const effectiveSourceClave = newClave ?? sourceClave;
            if (newClave && s.properties['clave unica'] !== newClave) {
            s.properties['clave unica'] = newClave;
            }

            const missingPeers: string[] = [];

            for (const op of ops) {
                // 3) ALWAYS apply change to SOURCE torre
                if (op.kind === 'add' || op.kind === 'update') {
                    this.upsertEnlace(s.properties.enlaces, op.enlace);
                } else if (op.kind === 'delete') {
                    this.deleteEnlace(s.properties.enlaces, op.enlace);
                }

                // 4) BEST-EFFORT mirror on peer torre
                const peer = await repo.createQueryBuilder('t')
                    .where(`t.geojson->'properties'->>'clave unica' = :clave`, { clave: op.peerClave })
                    .getOne();

                if (!peer) {
                    // Instead of throwing, just remember that we couldn't mirror
                    missingPeers.push(op.peerClave);
                    continue;
                }

                const p = peer.geojson ?? {};
                p.properties = p.properties ?? {};
                this.ensureArrays(p);

                const mirrored: Enlace = {
                    peer: effectiveSourceClave,
                    cluster: op.enlace.cluster,
                    estatus: op.enlace.estatus,
                    direction: this.invert(op.enlace.direction as Dir),
                };

                if (op.kind === 'add' || op.kind === 'update') {
                    this.upsertEnlace(p.properties.enlaces, mirrored);
                } else if (op.kind === 'delete') {
                    this.deleteEnlace(p.properties.enlaces, mirrored);
                }

                // Save peer torre
                peer.geojson = p;
                await repo.save(peer);
            }

            // 5) Save source torre LAST
            source.geojson = s;
            await repo.save(source);

            return {
                ok: true,
                source: effectiveSourceClave,
                ops: ops.length,
                missingPeers,  // you can show this in UI or logs if you want
            };
        });
    }

    async updateFeature(id: number, updateObj: any) {
        const fetchedFeature = await this.featuresRepository.findOne({ where: { id: id } });
    
        if (!fetchedFeature) {
            throw new HttpException('El Feature no existe', HttpStatus.NOT_FOUND);
        }
    
        let setClauses = [];
        let params: any = [id];
    
        // ✅ Direct column updates (municipio, activo, lat, long)
        if (updateObj.municipio) {
            setClauses.push(`municipio = $${params.length + 1}`);
            params.push(updateObj.municipio);
        }
        if (updateObj.activo !== undefined) {
            setClauses.push(`activo = $${params.length + 1}`);
            params.push(updateObj.activo);
        }
    
        // ✅ Handling properties JSON updates
        let jsonbQuery = 'properties';
        
        if (updateObj.properties) {
            const properties = typeof updateObj.properties === 'string' ? JSON.parse(updateObj.properties) : updateObj.properties;
    
            Object.entries(properties).forEach(([key, value], index) => {
                const jsonValue = typeof value === 'object' ? JSON.stringify(value) : `"${value}"`; // 🔥 Convert non-object to JSONB
    
                if (index === 0) {
                    jsonbQuery = `jsonb_set(properties::jsonb, '{properties,${key}}', $${params.length + 1}::jsonb, true)`;
                } else {
                    jsonbQuery = `jsonb_set(${jsonbQuery}, '{properties,${key}}', $${params.length + 1}::jsonb, true)`;
                }
                params.push(jsonValue);
            });
    
            if (Object.keys(properties).length > 0) {
                setClauses.push(`properties = ${jsonbQuery}`);
            }
        }
    
        if (setClauses.length === 0) {
            throw new HttpException('No valid updates provided', HttpStatus.BAD_REQUEST);
        }
    
        setClauses.push("updated_at = CURRENT_TIMESTAMP");
    
        const query = `
            UPDATE usr.red_troncal_features
            SET ${setClauses.join(", ")}
            WHERE id = $1;
        `;
    
        await this.featuresRepository.query(query, params);
    
        return { success: true };
    }

    async createFeature(feature: any, uid:string){
        const newFeature = this.featuresRepository.create({...feature,created_by: await this.getUserNameById(uid)})

        const saveRes = await this.featuresRepository.save(newFeature)
        if(saveRes) {
            console.log(saveRes)
            return {
                success:true,
                saveRes
            } 
        }
    }

    async createFeaturesFromArr(features: any[], uid: string) {
        try {
            if (!Array.isArray(features)) {
                throw new Error('El body debe ser un arreglo de features.');
            }

            const entities = features.map((feature) =>
                this.geoJsonRepository.create({
                    geojson: feature,
                }),
            );

            const saved = await this.geoJsonRepository.save(entities);

            return {
                ok: true,
                message: 'Features guardadas correctamente.',
                total: saved.length,
                data: saved,
            };
        } catch (error) {
            console.error('createFeaturesFromArr error', error);
            throw error;
        }
    }

    async isAdmin(uid: number){
        const res = await this.roleUserRepository.find({where: {userId: uid, roleId: 1}})
        return res.length > 0
    }

    async createSnapshot(img: Express.Multer.File, municipio: string, id_user: any, bbox){
        const id_user_number = Number(id_user)
        const isAdmin = await this.isAdmin(id_user_number)
        if(!isAdmin) throw new HttpException('No tiene acceso', HttpStatus.CONFLICT)

        const valitTypes = ['image/png', 'image/jpeg', 'image/jpg']

        if(!valitTypes.includes(img.mimetype)) throw new HttpException('El tipo de archivo no es valido', HttpStatus.CONFLICT)

        const newImage = this.municipioHistoryRepository.create({
            municipio_name: municipio,
            img_data: img.buffer,
            activo: true,
            bbox: bbox
        })
        const saveRes = await this.municipioHistoryRepository.save(newImage)
        console.log(saveRes)
        if(saveRes) return {
            success: true,
            snapId: saveRes.id
        }
    }

    async getSnapshots(municipio: string){
        const images = await this.municipioHistoryRepository.find({
            where: { municipio_name: municipio, activo: true },
            order: { created_at: "DESC" }, // 🔥 Order by latest first
            take: 3
        });

        if (!images.length) return [];

        // 🔄 Convert each image to Base64
        return images.map(img => ({
            id: img.id,
            image: `data:image/png;base64,${img.img_data.toString("base64")}`,
            created_at: img.created_at,
            bbox: img.bbox
        }));
    }

    async deleteSnapshot(id: number, uid: number){
        const isAdmin = await this.isAdmin(uid)
        if(!isAdmin) throw new HttpException('No tiene acceso', HttpStatus.CONFLICT)
        const snapshot = await this.municipioHistoryRepository.findOne({where: {id: id, activo: true}})
        if(!snapshot) throw new HttpException('El Snapshot no existe', HttpStatus.CONFLICT)
        snapshot.activo = false

        const saveRes = await this.municipioHistoryRepository.save(snapshot)

        if(saveRes) return {
            success: true
        }
    }

    private keyLock = new KeyLock();

    async handleCoberturas(files: Express.Multer.File[]) {
        if (!files?.length) {
            throw new HttpException('No se recibieron archivos', HttpStatus.CONFLICT);
        }

        // --- Validación por nombre (última línea de defensa en server)
        const notKmz: string[] = [];
        const badRttus: string[] = [];
        const noGroup: string[] = [];

        for (const f of files) {
            const name = f.originalname || '';
            if (!/\.kmz$/i.test(name)) notKmz.push(name);

            const rttu = this.extractRttuFromFilename(name);
            if (!rttu) badRttus.push(name);

            if (!/(proyectada|real)/i.test(name)) noGroup.push(name);
        }

        if (notKmz.length || badRttus.length || noGroup.length) {
            const msgs: string[] = [];
            if (notKmz.length) msgs.push(`Solo .kmz: ${notKmz.join(', ')}`);
            if (badRttus.length) msgs.push(`RTTU inválido (RTTU-XXXXXXXXXXX): ${badRttus.join(', ')}`);
            if (noGroup.length) msgs.push(`Falta grupo (“proyectada” o “real”): ${noGroup.join(', ')}`);
            throw new HttpException(msgs.join(' | '), HttpStatus.CONFLICT);
        }

        // --- Acumuladores de respuesta
        const results: { file: string; inserted: number }[] = [];
        const insertedDtos: CoberturaDTO[] = [];
        const replacedPairs: { oldId: string | null; newId: string }[] = [];

        // Orden estable para reducir contención en locks
        const filesSorted = [...files].sort((a, b) =>
            (a.originalname || '').localeCompare(b.originalname || '')
        );

        for (const f of filesSorted) {
            const fileName = f.originalname;
            const rttu = this.extractRttuFromFilename(fileName)!; // validado arriba
            const match = fileName.match(/(proyectada|real)/i)!;
            const group_label = match[1].toUpperCase() as GroupLabel;

            const key = `${rttu}::${group_label}`;

            // Serializa por (RTTU, grupo) dentro de este proceso (sin constraints/locks de DB)
            const { countInserted } = await this.keyLock.run<{
                countInserted: number;
                firstNewId: string;
                prevId: string | null;
            }>(key, async () => {
                // 1) Extraer y parsear KMZ/KML
                const tmpKmz = await this.writeTempKmz(f.buffer);
                let extracted: string | null = null;

                try {
                    extracted = await this.extractKmz(tmpKmz);
                    const kmlXml = await this.readDocKmlFromExtracted(extracted);
                    const overlays = this.parseOverlays(kmlXml);
                    if (!overlays.length) {
                        throw new HttpException(
                            `El KML no contiene GroundOverlay válidos en ${fileName}`,
                            HttpStatus.CONFLICT
                        );
                    }

                    // 2) Localiza cobertura activa anterior (solo para devolver pares reemplazados)
                    const prev = await this.coberturasRepo.findOne({
                        where: { rttu_id: rttu, group_label, activo: true } as any,
                        order: { id: 'DESC' } as any,
                    });

                    // 3) Desactiva cualquier set activo para esta llave
                    await this.deactivateActiveSet(rttu, group_label);

                    // 4) Inserta nuevo set
                    let insertedCount = 0;
                    let firstNewId: string | null = null;

                    for (const ov of overlays) {
                        const png = await this.readPngFromExtracted(extracted, ov.href);
                        if (!png) continue;

                        const saved = await this.insertOverlay(rttu, group_label, ov, png); // -> Cobertura (id: string)
                        const dto = this.toClientCobertura(saved);                          // -> CoberturaDTO (id: string)
                        insertedDtos.push(dto);

                        if (firstNewId == null) firstNewId = saved.id;
                        insertedCount++;
                    }

                    if (!insertedCount) {
                        throw new HttpException(
                            `No se pudieron leer las imágenes PNG referenciadas en ${fileName}`,
                            HttpStatus.CONFLICT
                        );
                    }

                    if (firstNewId != null) {
                        replacedPairs.push({ oldId: prev?.id ?? null, newId: firstNewId });
                    }

                    return {
                        countInserted: insertedCount,
                        firstNewId: firstNewId!,         // ya garantizado arriba
                        prevId: prev?.id ?? null,
                    };
                } finally {
                    await this.safeUnlink(tmpKmz);
                    if (extracted) await this.safeRmdirRecursive(extracted);
                }
            });

            results.push({ file: fileName, inserted: countInserted });
        }

        return {
            ok: true,
            total: insertedDtos.length,
            results,
            inserted: insertedDtos,
            replaced: replacedPairs,
        };
    }

    private toClientCobertura(c: Cobertura): CoberturaDTO {
        const { west, east, north, south } = c.boundbox as any;
        const coordinates: [number, number][] = [
            [west, north],
            [east,  north],
            [east,  south],
            [west,  south],
        ];
        const base64 = (c.png as unknown as Buffer).toString('base64');
        return {
            id: c.id,                        // string
            rttu_id: c.rttu_id,
            group_label: c.group_label,
            coordinates,
            created_at: c.created_at,
            imageDataUrl: `data:image/png;base64,${base64}`,
        };
    }

   /** Create a unique temp file path with a .kmz extension */
    private async writeTempKmz(buf: Buffer): Promise<string> {
        const tmp = nodePath.join(
            nodeOs.tmpdir(),
            `up_${randomBytes(6).toString('hex')}.kmz`,
        );
        // If your TS complains, the cast is fine; runtime accepts Buffer.
        await fsp.writeFile(tmp, buf as unknown as NodeJS.ArrayBufferView);
        return tmp;
    }

    /** Create a unique temp directory */
    private async makeTempDir(prefix = 'kmz_'): Promise<string> {
        const dir = nodePath.join(nodeOs.tmpdir(), `${prefix}${randomBytes(6).toString('hex')}`);
        await fsp.mkdir(dir, { recursive: true });
        return dir;
    }

    private async safeUnlink(p: string) {
        try { await fsp.unlink(p); } catch {}
    }

    private async safeRmdirRecursive(p: string) {
        try { await fsp.rm(p, { recursive: true, force: true }); } catch {}
    }
 
    private psEsc(s: string) {
        // Escape single quotes for PowerShell single-quoted literal
        return s.replace(/'/g, "''");
    }

    /** Extract KMZ -> tempDir. Uses unzip on *nix, PowerShell on Windows. Returns extraction dir. */
    private async extractKmz(kmzPath: string): Promise<string> {
        const destDir = await this.makeTempDir('kmz_extracted_');

        if (process.platform === 'win32') {
            const ps = 'powershell.exe';
            const src = this.psEsc(kmzPath);
            const dst = this.psEsc(destDir);

            // 1) Try Expand-Archive
            const expandArchiveCmd = `Expand-Archive -LiteralPath '${src}' -DestinationPath '${dst}' -Force`;
            try {
                await execFileAsync(ps, ['-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', expandArchiveCmd], { windowsHide: true });
                return destDir;
            } catch (e1) {
                // 2) Fallback: .NET ZipFile (works even if Archive module isn’t available)
                // NOTE: this uses .NET; overwrite=true is available on modern .NET.
                const zipFileCmd =
                    "Add-Type -AssemblyName System.IO.Compression.FileSystem; " +
                    `([IO.Compression.ZipFile]::ExtractToDirectory('${src}','${dst}',$true))`;
                try {
                    await execFileAsync(ps, ['-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', zipFileCmd], { windowsHide: true });
                    return destDir;
                } catch (e2) {
                    // 3) Fallback: tar.exe (bundled in modern Windows; understands zip)
                    try {
                    await execFileAsync('tar.exe', ['-xf', kmzPath, '-C', destDir]);
                    return destDir;
                    } catch (e3) {
                    await this.safeRmdirRecursive(destDir);
                    // Surface the root cause to help diagnose locally
                    const msg = [
                        'No se pudo extraer el KMZ en Windows.',
                        `Expand-Archive error: ${(e1 as any)?.message ?? e1}`,
                        `ZipFile error: ${(e2 as any)?.message ?? e2}`,
                        `tar.exe error: ${(e3 as any)?.message ?? e3}`,
                    ].join(' | ');
                    throw new HttpException(msg, HttpStatus.CONFLICT);
                    }
                }
            }
        }

        // Linux/macOS: unzip
        try {
            await execFileAsync('unzip', ['-oq', kmzPath, '-d', destDir], { maxBuffer: 200 * 1024 * 1024 });
            return destDir;
        } catch (e) {
            await this.safeRmdirRecursive(destDir);
            throw new HttpException(`No se pudo extraer el KMZ (unzip): ${(e as any)?.message ?? e}`, HttpStatus.CONFLICT);
        }
    }

    private extractRttuFromFilename(name: string): string | null {
        const m = name.match(/RTTU-[A-Za-z0-9]{11}\b/i);
        return m ? m[0].toUpperCase() : null;
    }

    /** Recursively find first file whose name ends with suffix (e.g., 'doc.kml') */
    private async findBySuffix(root: string, suffix: string): Promise<string | null> {
        const stack = [root];
        while (stack.length) {
            const dir = stack.pop()!;
            const entries = await fsp.readdir(dir, { withFileTypes: true });

            for (const ent of entries) {
                const full = nodePath.join(dir, ent.name);

                if (ent.isDirectory()) stack.push(full);
                else if (ent.isFile() && full.toLowerCase().endsWith(suffix.toLowerCase())) return full;
            }
        }
        return null;
    }

    private async findByClaveUnica(clave: string) {
    // JSONB lookup with QueryBuilder (Postgres)
        return this.geoJsonRepository.createQueryBuilder('t')
        .where(`t.geojson->'properties'->>'clave unica' = :clave`, { clave })
        .getOne();
    }

    /** Recursively find first file by its basename (case-insensitive) */
    private async findByBasename(root: string, base: string): Promise<string | null> {
        const want = base.toLowerCase();
        const stack = [root];

        while (stack.length) {
            const dir = stack.pop()!;
            const entries = await fsp.readdir(dir, { withFileTypes: true });

            for (const ent of entries) {
                const full = nodePath.join(dir, ent.name);

                if (ent.isDirectory()) stack.push(full);
                else if (ent.isFile() && ent.name.toLowerCase() === want) return full;
            }
        }
        return null;
    }

    /** Read doc.kml text from the extracted directory */
    private async readDocKmlFromExtracted(extractedDir: string): Promise<string> {
        const kmlPath = await this.findBySuffix(extractedDir, nodePath.sep + 'doc.kml');

        if (!kmlPath) throw new HttpException('No se encontró doc.kml en el KMZ', HttpStatus.CONFLICT);

        return fsp.readFile(kmlPath, 'utf8');
    }

    /** Resolve PNG path inside the extracted directory based on KML href */
    private async readPngFromExtracted(extractedDir: string, href: string): Promise<Buffer | null> {
        if (/^[a-z]+:\/\//i.test(href)) return null; // external URL
        let rel = href.replace(/^\.\//, '');
        // Convert KML’s forward slashes to current OS separators
        let candidate = nodePath.join(extractedDir, ...rel.split('/'));
        try {
            const st = await fsp.stat(candidate);

            if (st.isFile()) return fsp.readFile(candidate);
        } catch {
            // Try by basename anywhere
            const base = rel.split('/').pop()!;
            const found = await this.findByBasename(extractedDir, base);
            if (found) return fsp.readFile(found);
        }
        return null;
    }

    /**
     * Minimal KML parser for GroundOverlay blocks using regex.
     * Extracts name, href, and LatLonBox (north/south/east/west).
     */
    private parseOverlays(kml: string): Array<{
        rttuId: string;
        north: number;
        south: number;
        east: number;
        west: number;
        href: string;
    }> {
        const out: Array<{
            rttuId: string;
            north: number;
            south: number;
            east: number;
            west: number;
            href: string;
        }> = [];

        // Collapse whitespace to simplify regex
        const xml = kml.replace(/\r/g, '');

        const overlayRe = /<GroundOverlay\b[\s\S]*?<\/GroundOverlay>/gi;
        const nameRe = /<name>([\s\S]*?)<\/name>/i;
        const hrefRe = /<Icon>\s*<href>([^<]+)<\/href>\s*<\/Icon>/i;
        const northRe = /<LatLonBox>[\s\S]*?<north>([^<]+)<\/north>/i;
        const southRe = /<LatLonBox>[\s\S]*?<south>([^<]+)<\/south>/i;
        const eastRe  = /<LatLonBox>[\s\S]*?<east>([^<]+)<\/east>/i;
        const westRe  = /<LatLonBox>[\s\S]*?<west>([^<]+)<\/west>/i;

        const blocks = xml.match(overlayRe) || [];
        for (const block of blocks) {
            const name = block.match(nameRe)?.[1]?.trim() ?? '';
            const href = block.match(hrefRe)?.[1]?.trim() ?? '';
            const north = Number(block.match(northRe)?.[1]);
            const south = Number(block.match(southRe)?.[1]);
            const east  = Number(block.match(eastRe)?.[1]);
            const west  = Number(block.match(westRe)?.[1]);

            if (!name || !href || [north, south, east, west].some(v => Number.isNaN(v))) continue;

            const rttuMatch = name.match(/(RTTU-[A-Za-z0-9]+)/);
            const rttuId = rttuMatch?.[1] ?? name.split(/\s+/)[0];

            out.push({ rttuId, north, south, east, west, href });
        }
        return out;
    }

    async getCoberturas(id_user: number){
        const isAdmin = await this.isAdmin(id_user)
        
        const coberturas = await this.coberturasRepo.find({
            where: {activo: true}, 
        })

        if(!coberturas.length) return []

        return coberturas.map((c) => {
            const { west, east, north, south } = c.boundbox as any;
            const coordinates: [number, number][] = [
                [west, north],
                [east,  north],
                [east,  south],
                [west,  south],
            ];
            const base64 = (c.png as unknown as Buffer).toString('base64');
            return {
                id: c.id,
                rttu_id: c.rttu_id,
                group_label: c.group_label as 'PROYECTADA' | 'REAL',
                coordinates,
                created_at: c.created_at,
                // data URL that Mapbox can use directly
                imageDataUrl: `data:image/png;base64,${base64}`,
            };
        });
    }

    /** Deactivate any active cobertura rows for this (rttu, group). */
    private async deactivateActiveSet(rttu: string, group: GroupLabel){
        await this.coberturasRepo.update(
        { rttu_id: rttu, group_label: group, activo: true } as any,
        { activo: false } as any
        );
    }

    /** Persist a single overlay as a Cobertura (activo=true). */
    private async insertOverlay(
    rttu: string,
    group: GroupLabel,
    ov: Overlay,
    png: Buffer
    ): Promise<Cobertura> {
        // Create a *single* entity and cast it as Cobertura so TypeORM picks the single overload
        const entity = this.coberturasRepo.create({
            rttu_id: rttu,
            group_label: group,
            boundbox: { north: ov.north, south: ov.south, east: ov.east, west: ov.west },
            png,
            activo: true,
        }) as Cobertura;

        // Either cast the arg or pass the generic so return type is Promise<Cobertura> (not array)
        return await this.coberturasRepo.save<Cobertura>(entity);
    }

    async getCoberturaPng(id: string){
        const row = await this.coberturasRepo.findOne({where: {id: id, activo: true}, select: ['png']})
        if(!row) throw new HttpException(`La cobertura con id ${id} no existe`, HttpStatus.CONFLICT)
        return row.png
    }
}
