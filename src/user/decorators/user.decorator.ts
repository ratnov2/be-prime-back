import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { UserModel } from 'src/user/user.model'
import { UpdateDtoFavoritePhotos } from '../dto/update.dto'

type TypeData = keyof UserModel

export const User = createParamDecorator(
	(data: TypeData, ctx: ExecutionContext) => {
		const request = ctx.switchToHttp().getRequest()
		const user = request.user
		
		return data ? user?.[data] : user
	}
)
export const ObjDecorator = createParamDecorator((data: UpdateDtoFavoritePhotos) => {
	//console.log('@@@@@')
	return data
})