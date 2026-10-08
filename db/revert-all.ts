import dataSource from './data-source';

dataSource
	.initialize()
	.then(async () => {
		console.log("Data Source has been initialized!")
		console.log("Revert all migrations")
		for (const migration of dataSource.migrations) {
			console.log('reverting last')
			await dataSource.undoLastMigration()
		}
		console.log('completed')
		dataSource.destroy()
	})
	.catch((err) => {
		console.error("Error during Data Source initialization:", err)
	})