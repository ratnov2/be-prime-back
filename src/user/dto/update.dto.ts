import { IsEmail, IsString, MinLength } from 'class-validator'
import { ObjDecorator } from '../decorators/user.decorator'

export class UpdateDto {
	@IsEmail()
	email: string

	@IsString()
	password?: string

	isAdmin?: boolean
}

export class UpdateInfoDto {
	@IsString()
	firstName: string

	@IsString()
	lastName: string
}
export class UpdateDtoFavoritePhotos {
	key: 'photoOne' | 'photoTwo' | 'photoThree'

	@IsString()
	frontPhoto: string

	@IsString()
	backPhoto: string

	@IsString()
	created: string
}
