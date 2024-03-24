import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { path } from 'app-root-path'
import { emptyDir, ensureDir, writeFile } from 'fs-extra'
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
		type: 'frontPhoto' | 'backPhoto' | 'frontPhoto_backPhoto',
		user: UserModel
	): Promise<any> {
		if (folder !== 'main' && folder !== 'second' && folder !== 'avatar')
			throw new NotFoundException('incorrect path')
		const randomName = Array(32)
			.fill(null)
			.map(() => Math.round(Math.random() * 16).toString(16))
			.join('')
		const uploadFolder = `${path}/uploads/${folder}/${user._id}`
		const uploadFileFolder = `/uploads/${folder}/${user._id}/${randomName}`
		const writeFileFolder = `${uploadFolder}/${randomName}`

		const user2 = await this.UserModel.findById(user._id).exec()
		if (user2.avatar) await emptyDir(`uploads/avatar/${user2.id}`)
		await ensureDir(uploadFolder)
		if (folder === 'avatar') {
			const res: any = await Promise.all(
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
				})
			)
			user2.avatar = `${uploadFileFolder}.webp`
			await user2.save()
			return user2.avatar
		}

		if (
			type !== 'frontPhoto' &&
			type !== 'backPhoto' &&
			type !== 'frontPhoto_backPhoto'
		)
			throw new BadRequestException('You not use type')

		if (type === 'frontPhoto_backPhoto') {
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
					const lastCreatedPhoto = createdUserLast?.created
					const newPhoto = {
						created,
						photo: `${uploadFileFolder}.webp`,
						locate: '',
					}
					// if i  haven't CreatedPhoto in latest day and i add photo to there
					const newCalendarPhoto: IcalendarPhotos = {
						created,
						comment: '',
						comments: [],
						photos: { backPhoto: newPhoto },
						photoReactions: [],
					}

					//newCalendarPhoto[type] = newPhoto
					user2.calendarPhotos = [...user2.calendarPhotos, newCalendarPhoto]

					return {
						url: `/uploads/${folder}/${randomName}`,
						name: file.originalname,
					}
				})
			)
		}
		//const user2 = await this.UserModel.findById(id).exec()
		//console.log(user)
		// console.log(files)

		//const date = new Date()

		//const flag = `${year}-${month}-${day}`
		// if (
		// 	user2.calendarPhotos[user2.calendarPhotos.length - 1]?.created === flag
		// ) {
		//throw new NotFoundException('alreade have')
		//}
		//console.log(uploadFolder);

		//user2.save()

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
				const lastCreatedPhoto = createdUserLast?.created
				const newPhoto = {
					created,
					photo: `${uploadFileFolder}.webp`,
					locate: '',
				}
				if (lastCreatedPhoto) {
					//---------//
					//////have only 1 created photo?
					//////i  have 1 photo -> means split lastCreatedphoto
					//--------//
					const dateLastCreatedPhoto = new Date(lastCreatedPhoto)
					const day = dateLastCreatedPhoto.getDate()
					const year = dateLastCreatedPhoto.getFullYear()
					const month = dateLastCreatedPhoto.getMonth()

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

						user2.calendarPhotos = [...user2.calendarPhotos, popped]
						await user2.save()
					}
					// else {
					// 	// if i  haven't CreatedPhoto in latest day and i add photo to there
					// 	const newCalendarPhoto = {
					// 		created,
					// 		comment: '',
					// 		comments: [],
					// 		photos: { [type]: newPhoto },
					// 	}

					// 	//newCalendarPhoto[type] = newPhoto
					// 	user2.calendarPhotos = [...user2.calendarPhotos, newCalendarPhoto]
					// }
				} else {
					// if i  haven't CreatedPhoto in latest day and i add photo to there
					const newCalendarPhoto: IcalendarPhotos = {
						created,
						comment: '',
						comments: [],
						photos: { [type]: newPhoto },
						photoReactions: [],
					}

					//newCalendarPhoto[type] = newPhoto
					user2.calendarPhotos = [...user2.calendarPhotos, newCalendarPhoto]
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
	async saveTwoFiles(
		files: Express.Multer.File[],
		folder: 'main',
		type: 'frontPhoto_backPhoto',
		user: UserModel
	): Promise<any> {
		if (folder !== 'main') throw new NotFoundException('incorrect path')

		const user2 = await this.UserModel.findById(user._id).exec()
		const created = new Date()
		const createdUserLast = user.calendarPhotos[user.calendarPhotos.length - 1]
		const lastCreatedPhoto = createdUserLast?.created

		//console.log(createdUserLast?.created?.getDate() === created.getDate())
		// if (createdUserLast?.created?.getDate() === created.getDate())
		// 	throw new NotFoundException('LOL')
		//console.log(files)

		//	console.log(type);
		if (type !== 'frontPhoto_backPhoto')
			throw new BadRequestException('You not use type')

		if (type === 'frontPhoto_backPhoto') {
			const res: FileResponse[] = await Promise.all(
				files.map(async (file) => {
					const randomName = Array(32)
						.fill(null)
						.map(() => Math.round(Math.random() * 16).toString(16))
						.join('')
					const uploadFolder = `${path}/uploads/${folder}/${user._id}`
					const uploadFileFolder = `/uploads/${folder}/${user._id}/${randomName}`
					const writeFileFolder = `${uploadFolder}/${randomName}`
					if (user2.avatar) await emptyDir(`uploads/avatar/${user2.id}`)
					await ensureDir(uploadFolder)
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

					const newPhoto = {
						created,
						photo: `${uploadFileFolder}.webp`,
						locate: '',
					}

					// if i  haven't CreatedPhoto in latest day and i add photo to there

					return {
						url: `${uploadFileFolder}.webp`,
						name: file.originalname,
					}
				})
			)
			//console.log('res', res)
			const photos = {
				[res[0].name === 'photo2.jpg' ? 'backPhoto' : 'frontPhoto']: {
					created,
					photo: res[0].url,
					locate: '',
				},
				[res[1].name === 'photo.jpg' ? 'frontPhoto' : 'backPhoto']: {
					created,
					photo: res[1].url,
					locate: '',
				},
			}
			const newCalendarPhoto: IcalendarPhotos = {
				created,
				comment: '',
				comments: [],
				photos,
				photoReactions: [],
			}

			//newCalendarPhoto[type] = newPhoto
			user2.calendarPhotos = [...user2.calendarPhotos, newCalendarPhoto]
		}

		user2.save()

		return user2.calendarPhotos
	}
}
