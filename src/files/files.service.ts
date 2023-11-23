import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { path } from 'app-root-path'
import { ensureDir, writeFile } from 'fs-extra'
import { FileResponse } from './dto/file.response'
import { extname, join } from 'path'
import { IcalendarPhotos, UserModel } from 'src/user/user.model'
import { InjectModel } from 'nestjs-typegoose'
import { ModelType } from '@typegoose/typegoose/lib/types'
import * as sharp from 'sharp'

@Injectable()
export class FilesService {
	constructor(
		@InjectModel(UserModel) private readonly UserModel: ModelType<UserModel>
	) {}
	async saveFiles(
		files: Express.Multer.File[],
		folder: 'main' | 'second' | 'avatar',
		type: 'frontPhoto' | 'backPhoto',
		user: UserModel
	): Promise<any> {
		if (type !== 'frontPhoto' && type !== 'backPhoto')
			throw new BadRequestException('You not use type')
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
			//throw new NotFoundException('alreade have')
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
				await sharp(file.buffer)
					.resize({
						width: 600,
						height: 1020,
						// background:'transparent',
						fit: 'outside',
					})
					.toFormat('webp')
					.webp({ quality: 10 })
					.toFile(join(`${writeFileFolder}.webp`))

				const created = new Date()
				const createdUserLast =
					user.calendarPhotos[user.calendarPhotos.length - 1]
				const lastCreatedPhoto = createdUserLast.created
				if (lastCreatedPhoto) {
					//---------//
					//////have only 1 created photo?
					//////i  have 1 photo -> means split lastCreatedphoto
					//--------//
					const [year, month, day] = lastCreatedPhoto.split('-')
					const newPhoto = {
						created,
						photo: `${uploadFileFolder}.webp`,
						locate: '',
					}
					if (
						created.getDate() === +day &&
						created.getFullYear() === +year &&
						created.getMonth() === +month
					) {
						// if i  have already CreatedPhoto in latest day and i add photo to there
						if (!!createdUserLast.photos[type]?.photo)
							throw new BadRequestException(`You already have ${type} photos`)

						const ff = {
							...createdUserLast.photos,
							[type]: newPhoto,
						}
						const popped = user2.calendarPhotos.pop()
						popped.photos = ff

						console.log('!!!')
						user2.calendarPhotos = [...user2.calendarPhotos,popped]
						await user2.save()

					} else {
						// if i  haven't CreatedPhoto in latest day and i add photo to there
						const newCalendarPhoto = {
							created: `${created.getFullYear()}-${created.getMonth()}-${created.getDate()}`,
							comment: '',
							comments: [],
							photos: { [type]: newPhoto },
						}
						//newCalendarPhoto[type] = newPhoto
						user2.calendarPhotos = [...user2.calendarPhotos, newCalendarPhoto]
					}
				}
				// if (created.getDate === createdUserLast.created)
				// 	// const newPhotos = {
				// 	// 	created: flag,
				// 	// 	photos: {},
				// 	// 	comment: '',
				// 	// 	comments: [],
				// 	// }
				// 	newPhotos.photos[type] = {
				// 		created,
				// 		photo: `${uploadFileFolder}.webp`,
				// 		locate: '',
				// 	}
				// user2.calendarPhotos = [...user2.calendarPhotos, newPhotos]
				//user2.calendarPhotos
				return {
					url: `/uploads/${folder}/${randomName}`,
					name: file.originalname,
				}
			})
		)
		//user2.calendarPhotos = [...user2.calendarPhotos]

		user2.save()

		return user2.calendarPhotos
	}
}
