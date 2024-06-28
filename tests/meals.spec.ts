import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { execSync } from 'node:child_process'

describe('meals routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })
  it('should be able to create a new meal', async () => {
    const userResponse = await createUser()
    expect(userResponse.status).toBe(201)
    const cookies = userResponse.get('Set-Cookie')

    const mealResponse = await createMeal(String(cookies))
    expect(mealResponse.status).toBe(201)
  })
  it('should be able to update a new meal', async () => {
    const userResponse = await createUser()
    expect(userResponse.status).toBe(201)
    const cookies = userResponse.get('Set-Cookie')

    const mealResponse = await createMeal(String(cookies))
    expect(mealResponse.status).toBe(201)

    const {
      body: { meals }
    } = await getAllMeals(String(cookies))

    await request(app.server)
      .put(`/meal/${meals[0].id}`)
      .send({
        name: 'Janta alterado',
        description: 'Ovo com pao',
        is_on_diet: true,
        date: '2024-06-25'
      })
      .set('Cookie', String(cookies))
      .expect(201)
  })
  it('should be able to delete a meal', async () => {
    const userResponse = await createUser()
    expect(userResponse.status).toBe(201)
    const cookies = userResponse.get('Set-Cookie')

    const mealResponse = await createMeal(String(cookies))
    expect(mealResponse.status).toBe(201)

    const {
      body: { meals }
    } = await getAllMeals(String(cookies))

    await request(app.server)
      .delete(`/meal/${meals[0].id}`)
      .set('Cookie', String(cookies))
      .expect(202)
  })
  it('should be able get all meals', async () => {
    const userResponse = await createUser()
    expect(userResponse.status).toBe(201)
    const cookies = userResponse.get('Set-Cookie')

    const firstMealResponse = await createMeal(String(cookies))
    expect(firstMealResponse.status).toBe(201)

    const secondMealResponse = await createMeal(String(cookies))
    expect(secondMealResponse.status).toBe(201)

    const {
      body: { meals }
    } = await getAllMeals(String(cookies))

    expect(meals).toHaveLength(2)
  })
  it('should be able get one meal', async () => {
    const userResponse = await createUser()
    expect(userResponse.status).toBe(201)
    const cookies = userResponse.get('Set-Cookie')

    const mealResponse = await createMeal(String(cookies))
    expect(mealResponse.status).toBe(201)

    const {
      body: { meals }
    } = await getAllMeals(String(cookies))

    const oneMealResponse = await request(app.server)
      .get(`/meal/${meals[0].id}`)
      .set('Cookie', String(cookies))

    expect(oneMealResponse.body.meal).toEqual(
      expect.objectContaining({
        name: 'Janta',
        description: 'Ovo com pao',
        is_on_diet: 1
      })
    )
  })
  it('should be able to return metrics', async () => {
    const userResponse = await createUser()
    expect(userResponse.status).toBe(201)
    const cookies = userResponse.get('Set-Cookie')

    const firstMealResponse = await createMeal(String(cookies), true)
    expect(firstMealResponse.status).toBe(201)

    const secondMealResponse = await createMeal(String(cookies), true)
    expect(secondMealResponse.status).toBe(201)

    const thirdMealResponse = await createMeal(String(cookies), false)
    expect(thirdMealResponse.status).toBe(201)

    const metricsResponse = await request(app.server)
      .get('/meal/metrics')
      .set('Cookie', String(cookies))

    expect(metricsResponse.body).toEqual({
      mealsQuantity: 3,
      onDietMealsCount: 2,
      outOfDietMealsCount: 1,
      bestOnDietSequence: 2
    })
  })
})

async function createUser() {
  const userResponse = await request(app.server).post('/user').send({
    name: 'Caio',
    email: 'caio.mendes@brf.com',
    imgUrl: 'https;//'
  })
  return userResponse
}

async function createMeal(cookies: string, isOnDiet = true) {
  const newMealResponse = await request(app.server)
    .post('/meal')
    .send({
      name: 'Janta',
      description: 'Ovo com pao',
      is_on_diet: isOnDiet,
      date: '2024-06-25'
    })
    .set('Cookie', cookies)
  return newMealResponse
}

async function getAllMeals(cookies: string) {
  const response = await request(app.server).get('/meal').set('Cookie', cookies)
  return response
}
