# Template-NodeJS-NestJS
Template para back end de Sistemas Internos con NodeJS y NestJS V.9


## Pasos para la instalacion
- npm ci
- crear unicamente la base de datos en `postgres` con el nombre deseado
- copiar el archivo `.env.example` y renombrarlo a `.env`
- llenar los valores del `.env` con los datos de la conexion a la base de datos
- correr el comando `npm run migration:run` para crear la estructura de la base de datos
- iniciar el proyecto con `npm run start:debug`
- abrir el navegador y entrar a la ruta http://localhost:3007/api/seed para llenar la base de datos de los roles y permisos y crear el usuario admin
	```
	------
	```
