import { Injectable, NotFoundException } from '@nestjs/common'
import { path } from 'app-root-path'
import { ensureDir, writeFile } from 'fs-extra'
import { FileResponse } from './dto/file.response'
import { extname } from 'path'
import { IcalendarPhotos, UserModel } from 'src/user/user.model'
import { InjectModel } from 'nestjs-typegoose'
import { ModelType } from '@typegoose/typegoose/lib/types'

@Injectable()
export class FilesService {
	constructor(
		@InjectModel(UserModel) private readonly UserModel: ModelType<UserModel>
	) {}
	async saveFiles(
		files: Express.Multer.File[],
		folder: 'main' | 'second' | 'avatar',
		user: UserModel
	): Promise<FileResponse[]> {
		//const user2 = await this.UserModel.findById(id).exec()
		//console.log(user)
		// console.log(files)
		if (folder !== 'main' && folder !== 'second' && folder !== 'avatar')
			throw new NotFoundException('incorrect path')
		const uploadFolder = `${path}/uploads/${folder}/${user._id}`
		const user2 = await this.UserModel.findById(user._id).exec()
		await ensureDir(uploadFolder)
		const date = new Date()
		const year = date.getFullYear()
		const month = date.getMonth()
		const day = date.getDate()
		const flag = `${year}-${month}-${day}`
		if (
			user2.calendarPhotos[user2.calendarPhotos.length - 1]?.created === flag
		) {
			throw new NotFoundException('alreade have') 
		}
		//console.log(uploadFolder);

		//user2.save()

		const randomName = Array(32)
			.fill(null)
			.map(() => Math.round(Math.random() * 16).toString(16))
			.join('')
		const writeFileFolder = `${uploadFolder}/${randomName}`
		const uploadFileFolder = `/uploads/${folder}/${user._id}/${randomName}`
		const res: FileResponse[] = await Promise.all(
			files.map(async (file) => {
				await writeFile(
					`${writeFileFolder}${extname(file.originalname)}`,
					file.buffer
				)
				user2.calendarPhotos = [
					...user2.calendarPhotos,
					{
						created: flag,
						photo: `${uploadFileFolder}${extname(file.originalname)}`,
						comment: '',
						comments: [],
					},
				]
				return {
					url: `/uploads/${folder}/${randomName}`,
					name: file.originalname,
				}
			})
		)
		user2.calendarPhotos = [...user2.calendarPhotos]

		user2.save()

		return res
	}
}
