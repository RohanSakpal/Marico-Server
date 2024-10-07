import { Container } from '@azure/cosmos';
import { IUserDto } from './user.dto';
export declare class UserService {
    private readonly userContainer;
    constructor(userContainer: Container);
    getAllUsers(): Promise<IUserDto[]>;
    createUser(payload: IUserDto): Promise<{
        response: number;
        message: string;
    }>;
}
