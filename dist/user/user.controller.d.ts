import { IUserDto } from './user.dto';
import { UserService } from './user.service';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    getUsers(): Promise<IUserDto[]>;
    create(payload: IUserDto): Promise<{
        response: number;
        message: string;
    }>;
}
