"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseJsonInterceptor = void 0;
const common_1 = require("@nestjs/common");
let ParseJsonInterceptor = class ParseJsonInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        try {
            if (typeof request.body.Project === 'string') {
                request.body.project = JSON.parse(request.body.Project);
            }
            if (typeof request.body.TargetGrp === 'string') {
                request.body.TargetGrp = JSON.parse(request.body.TargetGrp);
            }
        }
        catch (error) {
            throw new common_1.BadRequestException('Invalid JSON format');
        }
        return next.handle();
    }
};
exports.ParseJsonInterceptor = ParseJsonInterceptor;
exports.ParseJsonInterceptor = ParseJsonInterceptor = __decorate([
    (0, common_1.Injectable)()
], ParseJsonInterceptor);
//# sourceMappingURL=utility.js.map