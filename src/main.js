import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
	console.log('weflnweflnwefl');
	const app = await NestFactory.create(AppModule)
	app.setGlobalPrefix('api')

	app.enableCors();
	await app.listen(4200)
}
bootstrap()
