# eureka-app

Setup:
1. Create all the .env files based on the examples
2. Build: docker-compose up --build

For backend testing:
1. Run all tests: docker-compose -f docker-compose.yml -f docker-compose.test.yml run --rm backend-test npm test -- --runInBand
2. Run only a Suite: docker-compose -f docker-compose.yml -f docker-compose.test.yml run --rm backend-test npm test -- tests/<file>.test.js
