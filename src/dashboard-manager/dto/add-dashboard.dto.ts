import { IsString } from "class-validator";


export class addDashboard{
    @IsString()
    nombre: string;

    @IsString()
    org: string;

    @IsString()
    link_powerbi: string;
}