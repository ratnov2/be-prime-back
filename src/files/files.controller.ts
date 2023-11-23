import {
	Controller,
	Get,
	HttpCode,
	Post,
	Query,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { FileResponse } from './dto/file.response'
import { FilesService } from './files.service'
import { User } from 'src/user/decorators/user.decorator'
import { Auth } from 'src/auth/decorators/Auth.decorator'
import { UserModel } from 'src/user/user.model'

@Controller('files')
export class FilesController {
	constructor(private readonly filesService: FilesService) {}
	@Auth()
	@Post()
	@HttpCode(200)
	@UseInterceptors(FileInterceptor('image'))
	async uploadFile(
		@UploadedFile() file: Express.Multer.File,
		@User() user: UserModel,
		@Query('folder') folder?: 'main' | 'second' | 'avatar',
		@Query('type') type?: 'frontPhoto' | 'backPhoto'
	) {
		return this.filesService.saveFiles([file], folder,type, user)
	}
}
