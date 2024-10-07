"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const azure_database_1 = require("@nestjs/azure-database");
const cosmos_1 = require("@azure/cosmos");
const user_entity_1 = require("./user.entity");
let UserService = class UserService {
    constructor(userContainer) {
        this.userContainer = userContainer;
    }
    async getAllUsers() {
        const sqlQuery = 'SELECT * FROM c';
        const cosmosResult = await this.userContainer.items.query(sqlQuery).fetchAll();
        return cosmosResult.resources.map((value) => ({
            id: value.id,
            userid: value.userid,
            email: value.email,
            userName: value.userName,
            access: value.access,
        }));
    }
    async createUser(payload) {
        const newUser = new user_entity_1.User();
        newUser.id = '2';
        newUser.userid = payload.userid;
        newUser.userName = payload.userName;
        newUser.email = payload.email;
        newUser.access = payload.access;
        await this.userContainer.items.create(newUser);
        return {
            response: 200,
            message: 'Successfully created',
        };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, azure_database_1.InjectModel)(user_entity_1.User)),
    __metadata("design:paramtypes", [cosmos_1.Container])
], UserService);
//# sourceMappingURL=user.service.js.map