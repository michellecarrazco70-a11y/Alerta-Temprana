import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';

export class AddPermissionsDto{
    
    @IsNotEmpty()
    @IsNumber()
    groupId: number;

    @IsNotEmpty()
    @IsArray()
    permissionIds: number[];

}