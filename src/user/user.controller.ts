import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	NotFoundException,
	Param,
	Post,
	Put,
	Query,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common'
import { User } from './decorators/user.decorator'
import { UserService } from './user.service'
import { Auth } from 'src/auth/decorators/Auth.decorator'
import {
	UpdateDto,
	UpdateDtoFavoritePhotos,
	UpdateInfoDto,
} from './dto/update.dto'
import { IdValidationPipe } from 'src/pipes/id.validation.pipe'
import { UserModel } from './user.model'
import { Types } from 'mongoose'

@Controller('users')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get('profile')
	@Auth()
	async getProfile(@User('_id') _id: string) {
		return this.userService.byId(_id)
	}

	@Get('profile/calendar-photos')
	@Auth()
	async getCalendarPhotos(@User('_id') _id: string) {
		return this.userService.getCalendarPhotos(_id)
	}

	@Put('profile/favorite-photos')
	@Auth()
	async updateFavoritePhotos(
		@User('_id') _id: string,
		@Body() data: UpdateDtoFavoritePhotos
	) {
		return this.userService.updateFavoritePhotos(_id, data)
	}

	// @UsePipes(new ValidationPipe())
	// @Put('profile')
	// @HttpCode(200)
	// @Auth()
	// async updateProfile(@User('_id') _id: string, @Body() data: UpdateDto) {
	// 	return this.userService.updateProfile(_id, data)
	// }

	@Put('profile/info')
	@HttpCode(200)
	@Auth()
	async updateProfileInfo(
		@User('_id') _id: string,
		@Body() data: UpdateInfoDto
	) {
		return this.userService.updateProfileInfo(_id, data)
	}

	@Get('profile/favorites')
	@Auth()
	async getFavorites(@User('_id') _id: string) {
		return this.userService.getFavoriteMovies(_id)
	}

	@Post('profile/favorites')
	@HttpCode(200)
	@Auth()
	async toggleFavorite(
		@Body('movieId', IdValidationPipe) movieId: Types.ObjectId,
		@User() user: UserModel
	) {
		return this.userService.toggleFavorite(movieId, user)
	}

	@Get('count')
	@Auth('admin')
	async getCountUsers() {
		return this.userService.getCount()
	}
	@Get('latest-photo')
	@Auth()
	async getLatestPhoto() {
		return this.userService.getLatestPhoto()
	}
	@Get()
	@Auth('admin')
	async getUsers(@Query('searchTerm') searchTerm?: string) {
		return this.userService.getAll(searchTerm)
	}

	@Get(':id')
	@Auth()
	async getUser(@Param('id', IdValidationPipe) id: string) {
		return this.userService.byId(id)
	}

	// @UsePipes(new ValidationPipe())
	// @Put(':id')
	// @HttpCode(200)
	// @Auth('admin')
	// async updateUser(
	// 	@Param('id', IdValidationPipe) id: string,
	// 	@Body() data: UpdateDto
	// ) {
	// 	return this.userService.updateProfile(id, data)
	// }

	@Delete(':id')
	@Auth('admin')
	async delete(@Param('id', IdValidationPipe) id: string) {
		const deletedDoc = await this.userService.delete(id)
		if (!deletedDoc) throw new NotFoundException('Movie not found')
	}

	//FRiends
	@Put('friends/add-friends')
	@Auth()
	async asyncAddFriend(
		@User('_id') _id: string,
		@Body() data: { friendId: string; status: '0' | '1' | '2' | '3' }
	) {
		return this.userService.addFriend(_id, data)
	}
	@Get('friends/all-friends')
	@Auth()
	async asyncGetAllFriend(@User('_id') _id: string) {
		return this.userService.getAllFriend(_id)
	}
	@Post('profile/main-message')
	@Auth()
	async addMainMessage(
		@User('_id') _id: string,
		@Body() data: { message: string; link: 'string' }
	) {
		return this.userService.addMainMessage(_id, data.message, data.link)
	}

	@Post('profile/user-message')
	@Auth()
	async addUserMessage(
		@User('_id') _id: string,
		@Body() data: { message: string; link: 'string'; userId: string }
	) {
		return this.userService.addComment(_id, data)
	}
}
