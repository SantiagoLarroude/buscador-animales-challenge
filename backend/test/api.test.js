const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');
const { getUsers, saveUsers } = require('../src/utils/db');

describe('API Tests - CustomsWatch Challenge', () => {
  let backupUsers = [];
  let validToken = '';
  const testEmail = `test_${Date.now()}@customswatch.com`;
  const testPassword = 'securePassword123';

  before(async () => {
    // Respaldar usuarios existentes para no alterar el archivo de base de datos
    backupUsers = await getUsers();
  });

  after(async () => {
    // Restaurar usuarios al estado original
    await saveUsers(backupUsers);
  });

  describe('Health check', () => {
    test('GET /health responde status OK', async () => {
      const res = await request(app).get('/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'OK');
    });
  });

  describe('Autenticación - /api/auth/signup', () => {
    test('Debe rechazar registros con email inválido (400)', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'correo-invalido', password: testPassword });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /formato válido/i);
    });

    test('Debe rechazar contraseñas de menos de 6 caracteres (400)', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: testEmail, password: '123' });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /al menos 6 caracteres/i);
    });

    test('Debe registrar un usuario válido exitosamente (201)', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: testEmail, password: testPassword });

      assert.equal(res.status, 201);
      assert.match(res.body.message, /registrado correctamente/i);
    });

    test('Debe rechazar emails duplicados (400)', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: testEmail, password: testPassword });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /ya se encuentra registrado/i);
    });
  });

  describe('Autenticación - /api/auth/login', () => {
    test('Debe responder 401 con mensaje genérico si el usuario no existe', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'inexistente@correo.com', password: 'password123' });

      assert.equal(res.status, 401);
      assert.equal(res.body.message, 'Credenciales inválidas.');
    });

    test('Debe responder 401 con mensaje genérico si la contraseña es incorrecta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'contraseñaErronea' });

      assert.equal(res.status, 401);
      assert.equal(res.body.message, 'Credenciales inválidas.');
    });

    test('Debe iniciar sesión exitosamente y devolver token JWT y usuario', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });

      assert.equal(res.status, 200);
      assert.ok(res.body.token, 'El token debe estar presente');
      assert.equal(res.body.user.email, testEmail.toLowerCase());
      validToken = res.body.token;
    });
  });

  describe('Catálogo de Animales - /api/animales (Ruta Protegida y Filtros)', () => {
    test('Debe rechazar la petición sin token de autorización (401)', async () => {
      const res = await request(app).get('/api/animales');
      assert.equal(res.status, 401);
    });

    test('Debe rechazar la petición con token adulterado o inválido (401)', async () => {
      const res = await request(app)
        .get('/api/animales')
        .set('Authorization', 'Bearer token_invalido_123');
      assert.equal(res.status, 401);
    });

    test('Debe devolver el listado completo de animales con token válido (200)', async () => {
      const res = await request(app)
        .get('/api/animales')
        .set('Authorization', `Bearer ${validToken}`);

      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body));
      assert.ok(res.body.length > 0);
    });

    test('Filtro por búsqueda parcial de nombre', async () => {
      const res = await request(app)
        .get('/api/animales?nombre=león')
        .set('Authorization', `Bearer ${validToken}`);

      assert.equal(res.status, 200);
      assert.ok(res.body.length > 0);
      res.body.forEach(a => {
        assert.ok(a.nombreComun.toLowerCase().includes('león'));
      });
    });

    test('Filtro exacto por clase', async () => {
      const res = await request(app)
        .get('/api/animales?clase=Ave')
        .set('Authorization', `Bearer ${validToken}`);

      assert.equal(res.status, 200);
      assert.ok(res.body.length > 0);
      res.body.forEach(a => {
        assert.equal(a.clase.toLowerCase(), 'ave');
      });
    });

    test('Filtro exacto por dieta', async () => {
      const res = await request(app)
        .get('/api/animales?dieta=Carnívoro')
        .set('Authorization', `Bearer ${validToken}`);

      assert.equal(res.status, 200);
      assert.ok(res.body.length > 0);
      res.body.forEach(a => {
        assert.equal(a.dieta.toLowerCase(), 'carnívoro');
      });
    });

    test('Filtro por rango de peso (pesoMin y pesoMax)', async () => {
      const res = await request(app)
        .get('/api/animales?pesoMin=100&pesoMax=500')
        .set('Authorization', `Bearer ${validToken}`);

      assert.equal(res.status, 200);
      assert.ok(res.body.length > 0);
      res.body.forEach(a => {
        assert.ok(a.pesoPromedioKg >= 100 && a.pesoPromedioKg <= 500);
      });
    });

    test('Filtro por estado de peligro de extinción (enPeligro=true)', async () => {
      const res = await request(app)
        .get('/api/animales?enPeligro=true')
        .set('Authorization', `Bearer ${validToken}`);

      assert.equal(res.status, 200);
      assert.ok(res.body.length > 0);
      res.body.forEach(a => {
        assert.equal(a.enPeligroExtincion, true);
      });
    });
  });
});

