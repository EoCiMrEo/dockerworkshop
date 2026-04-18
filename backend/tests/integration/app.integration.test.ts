import request from 'supertest';
import { buildApp } from '../../src/app.js';
import type { Queryable } from '../../src/types/database.js';
import { createIntegrationDb } from './helpers.js';

describe('API integration', () => {
  let db: Queryable;
  let closeDb: () => Promise<void>;

  beforeEach(async () => {
    const integrationDb = await createIntegrationDb();
    db = integrationDb.db;
    closeDb = integrationDb.close;
  });

  afterEach(async () => {
    await closeDb();
  });

  it('supports auth register/login/refresh/logout flow', async () => {
    const app = buildApp(db);

    const registerResponse = await request(app).post('/api/auth/register').send({
      username: 'alice_user',
      password: 'password123'
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.user.username).toBe('alice_user');

    const loginResponse = await request(app).post('/api/auth/login').send({
      username: 'alice_user',
      password: 'password123'
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.accessToken).toBeTruthy();
    expect(loginResponse.body.refreshToken).toBeTruthy();

    const refreshResponse = await request(app).post('/api/auth/refresh').send({
      refreshToken: loginResponse.body.refreshToken
    });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.refreshToken).not.toEqual(loginResponse.body.refreshToken);

    const logoutResponse = await request(app).post('/api/auth/logout').send({
      refreshToken: refreshResponse.body.refreshToken
    });

    expect(logoutResponse.status).toBe(204);
  });

  it('supports todo CRUD with filtering', async () => {
    const app = buildApp(db);

    const registerResponse = await request(app).post('/api/auth/register').send({
      username: 'todo_user',
      password: 'password123'
    });

    const accessToken = registerResponse.body.accessToken;

    const firstTodo = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Build backend',
        description: 'Express + PostgreSQL',
        priority: 'high',
        dueDate: new Date(Date.now() + 3600 * 1000).toISOString()
      });

    expect(firstTodo.status).toBe(201);

    const secondTodo = await request(app)
      .post('/api/todos')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Build frontend',
        priority: 'medium',
        completed: true
      });

    expect(secondTodo.status).toBe(201);

    const activeList = await request(app)
      .get('/api/todos?status=active&search=backend')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(activeList.status).toBe(200);
    expect(activeList.body.items).toHaveLength(1);
    expect(activeList.body.items[0].title).toBe('Build backend');

    const updateResponse = await request(app)
      .put(`/api/todos/${firstTodo.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        completed: true,
        priority: 'low'
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.completed).toBe(true);

    const completedList = await request(app)
      .get('/api/todos?status=completed')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(completedList.status).toBe(200);
    expect(completedList.body.total).toBe(2);

    const deleteResponse = await request(app)
      .delete(`/api/todos/${secondTodo.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(deleteResponse.status).toBe(204);
  });
});
