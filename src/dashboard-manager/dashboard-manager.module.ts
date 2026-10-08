import { Module } from "@nestjs/common";
import { DashboardManagerController } from "./dashboard-manager.controller";
import { DashboardManagerService } from "./dashboard-manager.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
	Avances,
	Cobertura,
	Dashboard,
	Features,
	FeaturesJson,
	FeaturesRevise,
	Log,
	MunicipioImage,
	Permission,
	RoleUser,
	User,
	dashboard_user,
	organizaciones,
	proyectos,
	userProyects,
} from "src/entities";
import { ProyectosManagerController } from "./proyectos-manager.controller";
import { ProyectosService } from "./proyectos-service.service";
import { MapaTroncalController } from "./mapa.controller";
import { MapaService } from "./mapa.service";
import { Profile } from "src/entities/usr/profiles.entity";
import { UserProfileRedTroncal } from "src/entities/usr/user-profile-red-troncal.entity";
import { Layer } from "src/entities/usr/layers.entity";
import { ProfileLayerPermission } from "src/entities/usr/profile-layer-permissions.entity";

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Permission,
			Dashboard,
			dashboard_user,
			User,
			organizaciones,
			Log,
			proyectos,
			RoleUser,
			userProyects,
			Avances,
			Features,
			MunicipioImage,
			FeaturesRevise,
			FeaturesJson,
			Cobertura,
			Profile,
			UserProfileRedTroncal,
			Layer,
			ProfileLayerPermission
		]),
	],
	controllers: [
		DashboardManagerController,
		ProyectosManagerController,
		MapaTroncalController,
	],
	providers: [DashboardManagerService, ProyectosService, MapaService],
        exports: [MapaService],
})
export class DashboardManagerModule {}
