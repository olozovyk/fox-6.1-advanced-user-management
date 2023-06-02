import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';

import { CreateUserDto } from 'src/common/dto/createUser.dto';
import { AuthService } from '../auth/auth.service';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { IUser } from 'src/common/types';
import { User } from 'src/common/entities/user.entity';
import { QueryPaginationDto } from 'src/common/dto';
import { ProtectUserChangesGuard } from 'src/common/guards/protectUserChanges.guard';

@Controller('users')
export class UsersController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
  ) {}

  @Get()
  public async getUsers(@Query() query: QueryPaginationDto) {
    const limit = query.limit || 20;
    const page = query.page || 1;

    const users = (await this.userService.getUsers(limit, page)) as User[];

    const usersToReturn: IUser[] = users.map(user => ({
      id: user.id,
      nickname: user.nickname,
      firstName: user.firstName,
      lastName: user.lastName,
    }));

    return {
      users: usersToReturn,
    };
  }

  @Get(':id')
  public async getUserById(
    @Param() params: { id: string },
    @Res() res: Response,
  ) {
    const user = await this.userService.getUserById(params.id);

    res.set('Last-Modified', user.updatedAt.toUTCString());
    res.json({
      id: user.id,
      nickname: user.nickname,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UseGuards(ProtectUserChangesGuard)
  public async editUser(
    @Param() params: { id: string },
    @Body() body: Partial<CreateUserDto>,
    @Res() res: Response,
  ) {
    const id = params.id;
    const { nickname, firstName, lastName, password } = body;

    if (nickname) {
      throw new HttpException(
        'You can not change the nickname',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!firstName && !lastName && !password) {
      throw new HttpException('Nothing to change', HttpStatus.BAD_REQUEST);
    }

    const newPassword = password
      ? this.authService.createHash(password)
      : undefined;

    const userToEdit: Omit<Partial<CreateUserDto>, 'nickname'> = {};

    if (firstName) {
      userToEdit.firstName = firstName;
    }

    if (lastName) {
      userToEdit.lastName = lastName;
    }

    if (password) {
      userToEdit.password = newPassword;
    }

    const resultOfUpdate = await this.userService.editUser(id, userToEdit);

    if (!resultOfUpdate) {
      throw new HttpException(
        'User is not updated',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const updatedUser = (await this.userService.getUserById(id)) as User;

    res.set('Last-Modified', updatedUser.updatedAt.toUTCString());
    res.json({
      user: {
        id: updatedUser.id,
        nickname: updatedUser.nickname,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
      },
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  public async deleteUser(@Param() params: { id: string }) {
    await this.userService.deleteUser(params.id);
  }
}
