import * as request from 'supertest';

const baseUrl = `http://localhost:3007/api`


describe('UserController (e2e)', () => {
	let accessToken: string

	beforeAll(async () => {
		accessToken = await login()
	});

	const getRequest = (method: 'get' | 'post' | 'put' | 'delete', url: string) =>
		request(baseUrl)[method](url)
			.set('Authorization', `Bearer ${accessToken}`)

	const login = async () => {
		const res = await getRequest('post', '/auth/login').send({
			email: 'admin@admin.com',
			password: '123123'
		})
		return res.body.accessToken
	}

	// it('Create user', () => {
	// 	return getRequest('post', '/usuarios')
	// 		.send(create_user_mock)
	// 		.expect((response) => {
	// 			try {
	// 				const body = response.body;
	// 				expect(response.status).toBe(200)
	// 				expect(body).toHaveProperty('uuid')
	// 				userCreated = body
	// 			} catch (error) {
	// 				console.info(response.body)
	// 				throw error;
	// 			}
	// 		})
	// });
	it('Get list of users', () => {
		return request(`http://localhost:3007/api`)
			.get('/usuarios')
			.set('Authorization', `Bearer ${accessToken}`)
			.expect(200)
			.expect((response) => {
				const body = response.body;
				expect(body).toHaveProperty('data')
				expect(body).toHaveProperty('total')
				expect(body.data[0]).toHaveProperty('uuid')
				// expect(body).toBeInstanceOf(PaginationResponseDTO);
			});
	});

	afterAll(async () => {
		// await app.close();
	});
});
