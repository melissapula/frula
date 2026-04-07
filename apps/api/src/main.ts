import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    // Global validation
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

    // CORS for Nuxt frontend
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    })

    // Swagger API docs (dev only)
    if (process.env.NODE_ENV !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('FSBO Platform API')
            .setDescription('For Sale By Owner — API Documentation')
            .setVersion('1.0')
            .addBearerAuth()
            .build()
        const document = SwaggerModule.createDocument(app, config)
        SwaggerModule.setup('docs', app, document)
    }

    const port = process.env.PORT || 3001
    await app.listen(port)
    console.log(`🏠 FSBO API running on port ${port}`)
}

bootstrap()
