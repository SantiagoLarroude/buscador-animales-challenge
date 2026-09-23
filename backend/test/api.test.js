const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const jwt = require('jsonwebtoken');
const request = require('supertest');

const testDbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'animals-api-'));
fs.copyFileSync(
  path.join(__dirname, '../database/animals.json'),
  path.join(testDbDir, 'animals.json')
);
fs.writeFileSync(path.join(testDbDir, 'users.json'), '[]\n', 'utf8');

process.env.NODE_ENV = 'test';
process.env.DB_DIR = testDbDir;
process.env.JWT_SECRET = 'test-only-secret-that-is-long-enough';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';

const app = require('../server');

const testEmail = `test_${Date.now()}@customswatch.test`;
const testPassword = 'securePassword123';
let validToken = '';

after(() => {
  fs.rmSync(testDbDir, { recursive: true, force: true });
});

describe('API Tests - CustomsWatch Challenge', () => {
  describe('Infraestructura', () => {
    test('GET /health responde status OK y aplica el origen configurado', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'OK');
      assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');
    });

    test('JSON malformado responde 400 con un error JSON', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .set('Content-Type', 'application/json')
        .send('{"email":');

      assert.equal(res.status, 400);
      assert.match(res.body.message, /JSON válido/i);
    });
  });

  describe('Autenticación - /api/auth/signup', () => {
    test('rechaza registros con email inválido', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'correo-invalido', password: testPassword });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /formato válido/i);
    });

    test('rechaza contraseñas de menos de 6 caracteres', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: testEmail, password: '123' });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /al menos 6 caracteres/i);
    });

    test('rechaza tipos de datos inválidos sin responder 500', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: ['test@customswatch.test'], password: { value: '123456' } });

      assert.equal(res.status, 400);
    });

    test('registra un usuario válido y normaliza el email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: `  ${testEmail.toUpperCase()}  `, password: testPassword });

      assert.equal(res.status, 201);
      assert.match(res.body.message, /registrado correctamente/i);
    });

    test('rechaza emails duplicados sin distinguir mayúsculas', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: testEmail.toUpperCase(), password: testPassword });

      assert.equal(res.status, 400);
      assert.match(res.body.message, /ya se encuentra registrado/i);
    });

    test('serializa dos registros concurrentes del mismo email', async () => {
      const concurrentEmail = `concurrent_${Date.now()}@customswatch.test`;
      const responses = await Promise.all([
        request(app).post('/api/auth/signup').send({ email: concurrentEmail, password: testPassword }),
        request(app).post('/api/auth/signup').send({ email: concurrentEmail, password: testPassword }),
      ]);

      assert.deepEqual(responses.map((response) => response.status).sort(), [201, 400]);
    });
  });

  describe('Autenticación - /api/auth/login', () => {
    test('responde 400 para tipos de credenciales inválidos', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: null, password: ['password123'] });

      assert.equal(res.status, 400);
    });

    test('responde 401 genérico si el usuario no existe', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'inexistente@correo.test', password: 'password123' });

      assert.equal(res.status, 401);
      assert.equal(res.body.message, 'Credenciales inválidas.');
    });

    test('responde 401 genérico si la contraseña es incorrecta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'contraseñaErronea' });

      assert.equal(res.status, 401);
      assert.equal(res.body.message, 'Credenciales inválidas.');
    });

    test('inicia sesión y devuelve un JWT y el usuario normalizado', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: ` ${testEmail.toUpperCase()} `, password: testPassword });

      assert.equal(res.status, 200);
      assert.ok(res.body.token);
      assert.equal(res.body.user.email, testEmail.toLowerCase());
      validToken = res.body.token;
    });
  });

  describe('Catálogo de Animales - autenticación', () => {
    test('rechaza una petición sin autorización', async () => {
      const res = await request(app).get('/api/animales');
      assert.equal(res.status, 401);
    });

    test('rechaza un esquema de autorización incorrecto', async () => {
      const res = await request(app)
        .get('/api/animales')
        .set('Authorization', `Basic ${validToken}`);
      assert.equal(res.status, 401);
    });

    test('rechaza un token adulterado', async () => {
      const res = await request(app)
        .get('/api/animales')
        .set('Authorization', 'Bearer token_invalido_123');
      assert.equal(res.status, 401);
    });

    test('rechaza un token expirado', async () => {
      const expiredToken = jwt.sign(
        { id: 1, email: testEmail },
        process.env.JWT_SECRET,
        { expiresIn: -1 }
      );
      const res = await request(app)
        .get('/api/animales')
        .set('Authorization', `Bearer ${expiredToken}`);

      assert.equal(res.status, 401);
      assert.match(res.body.message, /inválido o expirado/i);
    });
  });

  describe('Catálogo de Animales - filtros', () => {
    async function getAnimals(query = {}) {
      return request(app)
        .get('/api/animales')
        .query(query)
        .set('Authorization', `Bearer ${validToken}`);
    }

    test('devuelve el catálogo completo', async () => {
      const res = await getAnimals();
      assert.equal(res.status, 200);
      assert.equal(res.body.length, 30);
    });

    test('filtra por nombre parcial sin distinguir mayúsculas', async () => {
      const res = await getAnimals({ nombre: 'LEÓN' });
      assert.equal(res.status, 200);
      assert.ok(res.body.length > 0);
      res.body.forEach((animal) => assert.match(animal.nombreComun.toLowerCase(), /león/));
    });

    test('filtra por clase exacta', async () => {
      const res = await getAnimals({ clase: 'Ave' });
      assert.equal(res.status, 200);
      assert.ok(res.body.length > 0);
      res.body.forEach((animal) => assert.equal(animal.clase, 'Ave'));
    });

    test('filtra por dieta exacta', async () => {
      const res = await getAnimals({ dieta: 'Carnívoro' });
      assert.equal(res.status, 200);
      assert.ok(res.body.length > 0);
      res.body.forEach((animal) => assert.equal(animal.dieta, 'Carnívoro'));
    });

    test('filtra por continente exacto', async () => {
      const res = await getAnimals({ continente: 'África' });
      assert.equal(res.status, 200);
      assert.ok(res.body.length > 0);
      res.body.forEach((animal) => assert.equal(animal.continente, 'África'));
    });

    test('incluye ambos límites del rango de peso', async () => {
      const res = await getAnimals({ pesoMin: 190, pesoMax: 190 });
      assert.equal(res.status, 200);
      assert.ok(res.body.length > 0);
      res.body.forEach((animal) => assert.equal(animal.pesoPromedioKg, 190));
    });

    test('filtra especies en peligro', async () => {
      const res = await getAnimals({ enPeligro: true });
      assert.equal(res.status, 200);
      assert.ok(res.body.length > 0);
      res.body.forEach((animal) => assert.equal(animal.enPeligroExtincion, true));
    });

    test('filtra especies fuera de peligro', async () => {
      const res = await getAnimals({ enPeligro: false });
      assert.equal(res.status, 200);
      assert.ok(res.body.length > 0);
      res.body.forEach((animal) => assert.equal(animal.enPeligroExtincion, false));
    });

    test('combina continente, peligro y peso mínimo', async () => {
      const res = await getAnimals({ continente: 'África', enPeligro: true, pesoMin: 100 });
      assert.equal(res.status, 200);
      assert.ok(res.body.length > 0);
      res.body.forEach((animal) => {
        assert.equal(animal.continente, 'África');
        assert.equal(animal.enPeligroExtincion, true);
        assert.ok(animal.pesoPromedioKg >= 100);
      });
    });

    test('devuelve un arreglo vacío cuando no hay coincidencias', async () => {
      const res = await getAnimals({ nombre: 'animal-inexistente' });
      assert.equal(res.status, 200);
      assert.deepEqual(res.body, []);
    });

    test('rechaza pesos no numéricos o negativos', async () => {
      const [notNumeric, negative] = await Promise.all([
        getAnimals({ pesoMin: 'abc' }),
        getAnimals({ pesoMax: -1 }),
      ]);
      assert.equal(notNumeric.status, 400);
      assert.equal(negative.status, 400);
    });

    test('rechaza un rango invertido', async () => {
      const res = await getAnimals({ pesoMin: 500, pesoMax: 100 });
      assert.equal(res.status, 400);
      assert.match(res.body.message, /pesoMin no puede ser mayor/i);
    });

    test('rechaza valores booleanos desconocidos', async () => {
      const res = await getAnimals({ enPeligro: 'quizás' });
      assert.equal(res.status, 400);
      assert.match(res.body.message, /true o false/i);
    });
  });
});
