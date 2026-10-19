"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: ['http://localhost:3000', 'http://localhost:3002'],
        credentials: true,
    });
    await app.listen(3001);
    console.log('NestJS backend running on http://localhost:3001');
}
void bootstrap();
//# sourceMappingURL=main.js.map