import { IsEmail, IsString, MinLength } from 'class-validator'
import { ObjDecorator } from '../decorators/user.decorator'

export class UpdateDto {
	@IsEmail()
	email: string

	@IsString()
	password?: string

	isAdmin?: boolean
}

export class UpdateDtoFavoritePhotos {
	@IsString()
	photo: 'string'
}
