import {
	Controller,
	Get,
	HttpCode,
	Post,
	Query,
	UploadedFile,
	UploadedFiles,
	UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express'
import { FileResponse } from './dto/file.response'
import { FilesService } from './files.service'
import { User } from 'src/user/decorators/user.decorator'
import { Auth } from 'src/auth/decorators/auth.decorator'
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
		return this.filesService.saveFiles([file], folder, type, user)
	}

	@Auth()
	@Post('two')
	@HttpCode(200)
	@UseInterceptors(FilesInterceptor('files'))
	async uploadFiles(
		@UploadedFiles() file: Array<Express.Multer.File>,
		@User() user: UserModel,
		@Query('folder') folder?: 'main',
		@Query('type') type?: 'frontPhoto_backPhoto'
	) {
		return this.filesService.saveTwoFiles(file, folder, type, user)
	}
}
