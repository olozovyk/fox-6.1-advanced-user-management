import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from '../../dto/createUser.dto';

@Injectable()
export class UsersService {
  constructor(private userRepository: UsersRepository) {}

  getUsers(limit: number, page: number) {
    const skip = (page - 1) * limit;
    return this.userRepository.getUsers(limit, skip);
  }

  createUser(user: CreateUserDto) {
    return this.userRepository.createUser(user);
  }

  getUserByNickname(nickname: string) {
    return this.userRepository.getUserByNickname(nickname);
  }

  getUserById(id: number) {
    return this.userRepository.getUserById(id);
  }

  editUser(id: number, user: Omit<Partial<CreateUserDto>, 'nickname'>) {
    return this.userRepository.editUser(id, user);
  }
}
