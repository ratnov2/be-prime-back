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
	key: 'photoOne' | 'photoTwo' | 'photoThree'
	
	@MinLength(6, { message: 'Password cannot be less than 6 characters' })
	@IsString()
	photo: 'string'
}
